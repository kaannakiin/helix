'use client';

import { ActionIcon, Group, Text } from '@mantine/core';
import type { ICellRendererParams } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useCallback, useContext, useMemo, useRef } from 'react';
import DataTableProvider from '../../data-table/data-table-provider';
import { dataTableTheme } from '../../data-table/theme';
import { RelationDrawerContext } from './context';
import type { LookupItem } from './types';

interface Props {
  items?: LookupItem[];
  onRemove?: (id: string) => void;
  renderItem?: (item: LookupItem) => ReactNode;
  rowHeight?: number;
  height?: number;
  removeTooltip?: string;
  disabled?: boolean;
}

const DUMMY_COL = [{ colId: '__fw__', headerName: '' }];

export function RelationDrawerGridDisplay({
  items: itemsProp,
  onRemove: onRemoveProp,
  renderItem: renderItemProp,
  rowHeight = 48,
  height,
  removeTooltip = 'Remove',
  disabled,
}: Props) {
  const ctx = useContext(RelationDrawerContext);

  const items = itemsProp ?? ctx?.resolvedItems ?? [];
  const onRemove = onRemoveProp ?? ctx?.handleRemove;
  const renderItem =
    renderItemProp ?? ctx?.gridDisplayProps?.renderItem ?? ctx?.renderSelected;

  const defaultRenderItem = useCallback(
    (item: LookupItem) => (
      <Text size="sm" truncate>
        {item.label}
      </Text>
    ),
    []
  );

  const renderer = renderItem ?? defaultRenderItem;

  const onRemoveRef = useRef(onRemove);
  onRemoveRef.current = onRemove;
  const rendererRef = useRef(renderer);
  rendererRef.current = renderer;

  const fullWidthCellRenderer = useCallback(
    (params: ICellRendererParams<LookupItem>) => {
      if (!params.data) return null;
      const item = params.data;
      return (
        <Group
          gap="sm"
          wrap="nowrap"
          px="sm"
          style={{ height: '100%', width: '100%' }}
          align="center"
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            {rendererRef.current(item)}
          </div>
          {onRemoveRef.current && !disabled && (
            <ActionIcon
              variant="subtle"
              color="red"
              size="sm"
              title={removeTooltip}
              onClick={() => onRemoveRef.current?.(item.id)}
            >
              <X size={14} />
            </ActionIcon>
          )}
        </Group>
      );
    },
    [disabled, removeTooltip]
  );

  const effectiveRowHeight = ctx?.gridDisplayProps?.rowHeight ?? rowHeight;
  const effectiveHeight =
    height ??
    ctx?.gridDisplayProps?.height ??
    Math.min(items.length * effectiveRowHeight + 2, 300);

  const gridOptions = useMemo(
    () => ({
      theme: dataTableTheme,
      rowModelType: 'clientSide' as const,
      headerHeight: 0,
      rowHeight: effectiveRowHeight,
      reactiveCustomComponents: true,
      isFullWidthRow: () => true,
      fullWidthCellRenderer,
      getRowId: (params: { data: LookupItem }) => params.data.id,
      suppressNoRowsOverlay: true,
      suppressHorizontalScroll: true,
    }),
    [effectiveRowHeight, fullWidthCellRenderer]
  );

  if (items.length === 0) return null;

  return (
    <div style={{ height: effectiveHeight, width: '100%', overflow: 'hidden' }}>
      <DataTableProvider>
        <AgGridReact<LookupItem>
          columnDefs={DUMMY_COL}
          rowData={items}
          gridOptions={gridOptions}
        />
      </DataTableProvider>
    </div>
  );
}
