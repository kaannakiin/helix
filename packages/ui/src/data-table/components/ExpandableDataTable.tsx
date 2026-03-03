'use client';

import { Badge, Button, Group, Tooltip } from '@mantine/core';
import type {
  CellContextMenuEvent,
  ColDef,
  FilterChangedEvent,
  GridApi,
  GridOptions,
  GridReadyEvent,
  ModelUpdatedEvent,
  RowClickedEvent,
  SortChangedEvent,
} from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { Filter, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '../../utils/cn';
import {
  DataTableTranslationProvider,
  type DataTableTranslations,
} from '../context/DataTableTranslationContext';
import { HELIX_COLUMN_TYPES } from '../columnTypeRegistry';
import DataTableProvider from '../data-table-provider';
import { dataTableTheme } from '../theme';
import { useContextMenu } from '../hooks/useContextMenu';
import { useExpandableRows } from '../hooks/useExpandableRows';
import type { ContextMenuConfig } from '../types/contextMenu.types';
import type { ExpandableRowConfig } from '../types/expandableRow.types';
import { ContextMenu } from './ContextMenu';
import { DataTableFooter } from './DataTableFooter';
import { ExpandToggleCellRenderer } from './ExpandToggleCellRenderer';
import { FilterDrawer } from './FilterDrawer';

export interface ExpandableDataTableProps<TData> {
  tableId?: string;
  columns: ColDef<TData>[];
  rowData: TData[];
  expandableRow: ExpandableRowConfig<TData>;
  gridOptions?: Partial<GridOptions<TData>>;
  translations?: DataTableTranslations;
  className?: string;
  height?: number | string;
  onRowClicked?: (data: TData) => void;
  onSelectionChanged?: (selected: TData[]) => void;
  contextMenu?: ContextMenuConfig<TData>;
  showFilterDrawer?: boolean;
  loading?: boolean;
  idPrefix?: string;
}

type AnyGrid = any;

export function ExpandableDataTable<TData>({
  columns,
  rowData,
  expandableRow,
  gridOptions = {},
  translations,
  className,
  height = '600px',
  onRowClicked,
  onSelectionChanged,
  contextMenu,
  showFilterDrawer = false,
  loading = false,
  idPrefix,
}: ExpandableDataTableProps<TData>) {
  const contextMenuEnabled = contextMenu?.enabled !== false && contextMenu;

  const {
    wrapperRef,
    state: menuState,
    handleCellContextMenu,
    close: closeMenu,
  } = useContextMenu<TData>({ enabled: !!contextMenuEnabled });

  const [selectedRows, setSelectedRows] = useState<TData[]>([]);
  const [totalRows, setTotalRows] = useState<number | null>(null);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [filterModel, setFilterModel] = useState<Record<string, unknown>>({});
  const gridApiRef = useRef<GridApi | null>(null);

  const {
    getRowId,
    isFullWidthRow,
    getRowHeight,
    postSortRows,
    collapseAll,
    toggleRow,
    handleRowClicked: expandHandleRowClicked,
  } = useExpandableRows<TData>(expandableRow, idPrefix);

  const prevRowDataRef = useRef(rowData);
  useEffect(() => {
    if (prevRowDataRef.current !== rowData && gridApiRef.current) {
      collapseAll(gridApiRef.current as AnyGrid);
    }
    prevRowDataRef.current = rowData;
  }, [rowData, collapseAll]);

  const expandColumn = useMemo<ColDef>(
    () => ({
      colId: '__expand__',
      headerName: '',
      width: expandableRow.expandColumnWidth ?? 50,
      maxWidth: expandableRow.expandColumnWidth ?? 50,
      minWidth: expandableRow.expandColumnWidth ?? 50,
      flex: 0,
      sortable: false,
      filter: false,
      resizable: false,
      suppressMovable: true,
      pinned: 'left' as const,
      cellStyle: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
      cellRenderer: ExpandToggleCellRenderer,
      cellRendererParams: {
        isExpandable: expandableRow.isExpandable ?? (() => true),
        onToggle: (api: AnyGrid, data: AnyGrid) => {
          toggleRow(api, data);
        },
        expandTooltip: translations?.expandableRow?.expand,
        collapseTooltip: translations?.expandableRow?.collapse,
      },
    }),
    [expandableRow, toggleRow, translations]
  );

  const allColumns = useMemo(
    () => [expandColumn, ...columns] as ColDef[],
    [expandColumn, columns]
  );

  const handleSelectionChanged = useCallback(
    (event: { api: { getSelectedRows: () => TData[] } }) => {
      const rows = event.api.getSelectedRows();
      setSelectedRows(rows);
      onSelectionChanged?.(rows);
    },
    [onSelectionChanged]
  );

  const handleModelUpdated = useCallback((event: ModelUpdatedEvent) => {
    const count = event.api.getDisplayedRowCount();
    setTotalRows(count > 0 ? count : null);
  }, []);

  const handleGridReady = useCallback((event: GridReadyEvent) => {
    gridApiRef.current = event.api;
  }, []);

  const handleFilterChanged = useCallback(
    (event: FilterChangedEvent) => {
      const model = event.api.getFilterModel();
      setFilterModel(model);
      collapseAll(event.api as AnyGrid);
    },
    [collapseAll]
  );

  const handleSortChanged = useCallback(
    (event: SortChangedEvent) => {
      collapseAll(event.api as AnyGrid);
    },
    [collapseAll]
  );

  const handleApplyFilters = useCallback((model: Record<string, unknown>) => {
    const api = gridApiRef.current;
    if (!api) return;
    api.setFilterModel(model);
  }, []);

  const handleClearAllFilters = useCallback(() => {
    const api = gridApiRef.current;
    if (!api) return;
    api.setFilterModel({});
  }, []);

  const handleRefresh = useCallback(() => {
    const api = gridApiRef.current;
    if (!api) return;
    collapseAll(api as AnyGrid);
    (api as AnyGrid).setRowData([...rowData]);
  }, [collapseAll, rowData]);

  const activeFilterCount = Object.keys(filterModel).length;

  const handleRowClicked = useCallback(
    (event: RowClickedEvent) => {
      if (!event.data) return;

      if (!event.data.__isChild && onRowClicked) {
        onRowClicked(event.data as TData);
      }

      if (expandableRow.expandOnRowClick) {
        expandHandleRowClicked(event as AnyGrid);
      }
    },
    [onRowClicked, expandableRow.expandOnRowClick, expandHandleRowClicked]
  );

  const finalGridOptions = useMemo<GridOptions>(() => {
    const options: GridOptions = {
      theme: dataTableTheme,
      columnTypes: {
        ...HELIX_COLUMN_TYPES,
        ...((gridOptions as GridOptions).columnTypes ?? {}),
      },
      defaultColDef: {
        sortable: true,
        filter: false,
        resizable: true,
        flex: 1,
        minWidth: 100,
        floatingFilter: false,
        suppressMovable: true,
        ...(showFilterDrawer ? { suppressHeaderFilterButton: true } : {}),
      },
      alwaysMultiSort: true,
      pagination: false,
      animateRows: true,
      enableCellTextSelection: true,
      reactiveCustomComponents: true,
      enableFilterHandlers: true,
      localeText: translations?.agGrid,
      cellSelection: false,
      suppressContextMenu: true,

      getRowId: getRowId as AnyGrid,
      isFullWidthRow: isFullWidthRow as AnyGrid,
      fullWidthCellRenderer: expandableRow.fullWidthCellRenderer as AnyGrid,
      postSortRows: postSortRows as AnyGrid,
      getRowHeight: getRowHeight as AnyGrid,

      onCellContextMenu: contextMenuEnabled
        ? (event: CellContextMenuEvent) =>
            handleCellContextMenu(event as CellContextMenuEvent<TData>)
        : undefined,
      onBodyScroll: contextMenuEnabled ? () => closeMenu() : undefined,
      onRowClicked: handleRowClicked,
      onGridReady: handleGridReady,
      onFilterChanged: handleFilterChanged,
      onSortChanged: handleSortChanged,
      onModelUpdated: handleModelUpdated,
      onSelectionChanged: handleSelectionChanged as AnyGrid,
      ...(gridOptions as GridOptions),
    };

    return options;
  }, [
    translations,
    showFilterDrawer,
    getRowId,
    isFullWidthRow,
    expandableRow.fullWidthCellRenderer,
    postSortRows,
    getRowHeight,
    contextMenuEnabled,
    handleCellContextMenu,
    closeMenu,
    handleRowClicked,
    handleGridReady,
    handleFilterChanged,
    handleSortChanged,
    handleModelUpdated,
    handleSelectionChanged,
    gridOptions,
  ]);

  return (
    <DataTableTranslationProvider translations={translations}>
      <DataTableProvider>
        <div
          ref={contextMenuEnabled ? wrapperRef : undefined}
          className={cn('ag-grid-mantine-wrapper', className)}
          style={{
            height,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ flex: 1, minHeight: 0, width: '100%', height: '100%' }}>
            <AgGridReact
              columnDefs={allColumns}
              rowData={rowData}
              loading={loading}
              gridOptions={finalGridOptions}
            />
          </div>
          <Group
            gap={0}
            wrap="nowrap"
            style={{
              borderTop: '1px solid var(--mantine-color-default-border)',
              backgroundColor: 'var(--mantine-color-body)',
              borderRadius: '0 0 8px 8px',
            }}
          >
            <DataTableFooter
              totalRows={totalRows}
              selectedCount={selectedRows.length}
              translations={translations?.footer}
            />
            <Group gap="xs" mr="xs" wrap="nowrap">
              {showFilterDrawer && (
                <Button
                  variant="subtle"
                  size="compact-sm"
                  leftSection={<Filter size={14} />}
                  rightSection={
                    activeFilterCount > 0 ? (
                      <Badge size="xs" variant="filled" circle>
                        {activeFilterCount}
                      </Badge>
                    ) : undefined
                  }
                  onClick={() => setFilterDrawerOpen(true)}
                >
                  {translations?.filterDrawer?.title ?? 'Filters'}
                </Button>
              )}
              <Tooltip label={translations?.footer?.refresh ?? 'Refresh'}>
                <Button
                  variant="subtle"
                  size="compact-sm"
                  leftSection={<RefreshCw size={14} />}
                  onClick={handleRefresh}
                >
                  {translations?.footer?.refresh ?? 'Refresh'}
                </Button>
              </Tooltip>
            </Group>
          </Group>
          {contextMenuEnabled && (
            <ContextMenu<TData>
              state={menuState}
              config={contextMenu}
              selectedRows={selectedRows}
              onClose={closeMenu}
              translations={translations?.contextMenu}
            />
          )}
          {showFilterDrawer && (
            <FilterDrawer
              opened={filterDrawerOpen}
              onClose={() => setFilterDrawerOpen(false)}
              columns={allColumns}
              filterModel={filterModel}
              onApplyFilters={handleApplyFilters}
              onClearAll={handleClearAllFilters}
              translations={translations?.filterDrawer}
            />
          )}
        </div>
      </DataTableProvider>
    </DataTableTranslationProvider>
  );
}
