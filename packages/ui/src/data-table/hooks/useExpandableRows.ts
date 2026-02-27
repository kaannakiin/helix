'use client';

import type {
  GetRowIdParams,
  GridApi,
  IRowNode,
  IsFullWidthRowParams,
  PostSortRowsParams,
  RowClickedEvent,
  RowHeightParams,
} from 'ag-grid-community';
import { useCallback, useRef } from 'react';
import type {
  ExpandableData,
  ExpandableRowConfig,
} from '../types/expandableRow.types';

export function useExpandableRows<TData>(
  config: ExpandableRowConfig<TData>,
  idPrefix?: string
) {
  const expandedIdsRef = useRef<Set<string>>(new Set());
  const updatingIdsRef = useRef<Set<string>>(new Set());

  const {
    getRowId: getUserRowId,
    isExpandable,
    singleExpand = true,
    detailHeight = 300,
    getDetailHeight,
  } = config;

  const prefix = idPrefix ? `${idPrefix}:` : '';

  const getRowId = useCallback(
    (params: GetRowIdParams<TData & ExpandableData>) => {
      const data = params.data;
      const id = getUserRowId(data);

      if (data.__isChild) {
        return `${prefix}${id}_detail`;
      }
      return `${prefix}${id}_parent`;
    },
    [getUserRowId, prefix]
  );

  const isFullWidthRow = useCallback(
    (params: IsFullWidthRowParams<TData & ExpandableData>) => {
      return params.rowNode.data?.__isChild === true;
    },
    []
  );

  const getRowHeight = useCallback(
    (params: RowHeightParams<TData & ExpandableData>): number | undefined => {
      const data = params.node.data;
      if (data?.__isChild === true) {
        if (getDetailHeight) {
          return getDetailHeight(data as TData);
        }
        return detailHeight;
      }
      return undefined;
    },
    [detailHeight, getDetailHeight]
  );

  const postSortRows = useCallback(
    (params: PostSortRowsParams<TData & ExpandableData>) => {
      const { nodes } = params;
      const childMap = new Map<string, IRowNode<TData & ExpandableData>>();

      for (const node of nodes) {
        if (node.data?.__isChild && node.data.__parentId) {
          const parentRowId = `${prefix}${node.data.__parentId}_parent`;
          childMap.set(parentRowId, node);
        }
      }

      if (childMap.size === 0) return;

      const sorted: IRowNode<TData & ExpandableData>[] = [];

      for (const node of nodes) {
        if (node.data && !node.data.__isChild) {
          sorted.push(node);
          const child = childMap.get(node.id!);
          if (child) {
            sorted.push(child);
          }
        }
      }

      nodes.length = 0;
      nodes.push(...sorted);
    },
    [prefix]
  );

  const collapseAll = useCallback((api: GridApi<TData & ExpandableData>) => {
    if (expandedIdsRef.current.size === 0) return;

    const updates: (TData & ExpandableData)[] = [];
    const removes: (TData & ExpandableData)[] = [];

    api.forEachNode((node) => {
      const data = node.data;
      if (!data) return;

      if (data.__isExpanded) {
        updates.push({ ...data, __isExpanded: false });
      }
      if (data.__isChild) {
        removes.push(data);
      }
    });

    if (updates.length > 0 || removes.length > 0) {
      api.applyTransaction({ update: updates, remove: removes });
    }

    expandedIdsRef.current.clear();
  }, []);

  const toggleRow = useCallback(
    (api: GridApi<TData & ExpandableData>, data: TData & ExpandableData) => {
      if (!data || data.__isChild) return;

      if (isExpandable && !isExpandable(data as TData)) return;

      const rowId = getUserRowId(data as TData);
      if (updatingIdsRef.current.has(rowId)) return;

      updatingIdsRef.current.add(rowId);

      const onDone = () => {
        updatingIdsRef.current.delete(rowId);
      };

      if (data.__isExpanded) {
        const childRowId = `${prefix}${rowId}_detail`;
        const childNode = api.getRowNode(childRowId);

        if (childNode?.data) {
          api.applyTransaction({
            update: [{ ...data, __isExpanded: false }],
            remove: [childNode.data],
          });
        }

        expandedIdsRef.current.delete(rowId);
        onDone();
      } else {
        const updates: (TData & ExpandableData)[] = [];
        const removes: (TData & ExpandableData)[] = [];

        if (singleExpand) {
          api.forEachNode((node) => {
            const nodeData = node.data;
            if (!nodeData) return;

            if (
              nodeData.__isExpanded &&
              getUserRowId(nodeData as TData) !== rowId
            ) {
              updates.push({ ...nodeData, __isExpanded: false });
            }
            if (nodeData.__isChild && nodeData.__parentId !== rowId) {
              removes.push(nodeData);
            }
          });

          expandedIdsRef.current.clear();
        }

        const parentNode = api.getRowNode(`${prefix}${rowId}_parent`);
        const parentIndex = parentNode?.rowIndex ?? 0;

        const childRowData: TData & ExpandableData = {
          ...data,
          __isChild: true,
          __isExpanded: false,
          __parentId: rowId,
        };

        const updatedParent: TData & ExpandableData = {
          ...data,
          __isExpanded: true,
        };

        api.applyTransaction({
          update: [updatedParent, ...updates],
          add: [childRowData],
          addIndex: parentIndex + 1,
          remove: removes,
        });

        expandedIdsRef.current.add(rowId);
        onDone();
      }
    },
    [getUserRowId, isExpandable, singleExpand, prefix]
  );

  const handleRowClicked = useCallback(
    (event: RowClickedEvent<TData & ExpandableData>) => {
      if (!event.data || !event.api) return;
      toggleRow(event.api, event.data);
    },
    [toggleRow]
  );

  const isRowExpanded = useCallback((data: TData & ExpandableData): boolean => {
    return data.__isExpanded === true;
  }, []);

  return {
    getRowId,
    isFullWidthRow,
    getRowHeight,
    postSortRows,
    collapseAll,
    toggleRow,
    handleRowClicked,
    isRowExpanded,
    expandedIdsRef,
  };
}
