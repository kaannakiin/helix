'use client';

import { Badge, Button, Group, Tooltip } from '@mantine/core';
import type {
  CellContextMenuEvent,
  ColDef,
  FilterChangedEvent,
  GridApi,
  GridOptions,
  GridReadyEvent,
  IDatasource,
  ModelUpdatedEvent,
} from 'ag-grid-community';
import { themeQuartz } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { Filter, RefreshCw } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { cn } from '../../utils/cn';
import {
  DataTableTranslationProvider,
  type DataTableTranslations,
} from '../context/DataTableTranslationContext';
import DataTableProvider from '../data-table-provider';
import { useContextMenu } from '../hooks/useContextMenu';
import type { ContextMenuConfig } from '../types/contextMenu.types';
import { ContextMenu } from './ContextMenu';
import { DataTableFooter } from './DataTableFooter';
import { FilterDrawer } from './FilterDrawer';
import { createLoadingCellRenderer } from './LoadingCellRenderer';

export interface DataTableProps<TData> {
  tableId?: string;
  columns: ColDef<TData>[];
  datasource: IDatasource;
  gridOptions?: Partial<GridOptions<TData>>;
  translations?: DataTableTranslations;
  className?: string;
  height?: number | string;
  onRowClicked?: (data: TData) => void;
  onSelectionChanged?: (selected: TData[]) => void;
  debug?: boolean;
  contextMenu?: ContextMenuConfig<TData>;
  showFilterDrawer?: boolean;
}

const customTheme = themeQuartz.withParams({
  fontFamily: 'var(--mantine-font-family, -apple-system, sans-serif)',
  fontSize: 14,
  headerHeight: 48,
  rowHeight: 48,
  backgroundColor: 'var(--mantine-color-body)',
  foregroundColor: 'var(--mantine-color-text)',
  headerBackgroundColor: 'var(--mantine-color-default)',
  headerTextColor: 'var(--mantine-color-text)',
  oddRowBackgroundColor: 'var(--mantine-color-default-hover)',
  rowHoverColor: 'var(--mantine-color-default-hover)',
  selectedRowBackgroundColor: 'var(--mantine-primary-color-light)',
  borderColor: 'var(--mantine-color-default-border)',
  borderRadius: 8,
  wrapperBorderRadius: 8,
  rangeSelectionBorderColor: 'var(--mantine-primary-color-filled)',
  inputFocusBorder: true,
});

export function DataTable<TData>({
  columns,
  datasource,
  gridOptions = {},
  translations,
  className,
  height = '600px',
  onRowClicked,
  onSelectionChanged,
  debug = false,
  contextMenu,
  showFilterDrawer = false,
}: DataTableProps<TData>) {
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
  const [refreshDisabled, setRefreshDisabled] = useState(false);
  const gridApiRef = useRef<GridApi<TData> | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const columnsWithLoading = useMemo<ColDef<TData>[]>(
    () =>
      columns.map((col) => ({
        ...col,
        cellRenderer: createLoadingCellRenderer(col.cellRenderer),
      })),
    [columns]
  );

  const handleSelectionChanged = useCallback(
    (event: { api: { getSelectedRows: () => TData[] } }) => {
      const rows = event.api.getSelectedRows();
      setSelectedRows(rows);
      onSelectionChanged?.(rows);
    },
    [onSelectionChanged]
  );

  const handleModelUpdated = useCallback((event: ModelUpdatedEvent<TData>) => {
    const count = event.api.getDisplayedRowCount();
    setTotalRows(count > 0 ? count : null);
  }, []);

  const handleGridReady = useCallback((event: GridReadyEvent<TData>) => {
    gridApiRef.current = event.api;
  }, []);

  const handleFilterChanged = useCallback(
    (event: FilterChangedEvent<TData>) => {
      const model = event.api.getFilterModel();
      setFilterModel(model);
    },
    []
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

  const REFRESH_COOLDOWN_MS = 5000;

  const handleRefresh = useCallback(() => {
    const api = gridApiRef.current;
    if (!api || refreshDisabled) return;

    api.purgeInfiniteCache();

    setRefreshDisabled(true);
    refreshTimerRef.current = setTimeout(() => {
      setRefreshDisabled(false);
    }, REFRESH_COOLDOWN_MS);
  }, [refreshDisabled]);

  const activeFilterCount = Object.keys(filterModel).length;

  const finalGridOptions = useMemo<GridOptions<TData>>(() => {
    const options: GridOptions<TData> = {
      theme: customTheme,
      rowModelType: 'infinite' as const,
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
      cacheBlockSize: 100,
      cacheOverflowSize: 5,
      maxConcurrentDatasourceRequests: 1,
      infiniteInitialRowCount: 100,
      maxBlocksInCache: 10,
      reactiveCustomComponents: true,
      enableFilterHandlers: true,
      localeText: translations?.agGrid,
      cellSelection: false,
      suppressContextMenu: true,
      onCellContextMenu: contextMenuEnabled
        ? (event: CellContextMenuEvent<TData>) => handleCellContextMenu(event)
        : undefined,
      onBodyScroll: contextMenuEnabled ? () => closeMenu() : undefined,
      onRowClicked: onRowClicked
        ? (event) => {
            if (event.data) {
              onRowClicked(event.data);
            }
          }
        : undefined,
      onGridReady: handleGridReady,
      onFilterChanged: handleFilterChanged,
      onModelUpdated: handleModelUpdated,
      onSelectionChanged: handleSelectionChanged,
      ...gridOptions,
    };

    return options;
  }, [
    translations,
    onRowClicked,
    handleSelectionChanged,
    handleModelUpdated,
    handleGridReady,
    handleFilterChanged,
    gridOptions,
    debug,
    contextMenuEnabled,
    handleCellContextMenu,
    closeMenu,
    showFilterDrawer,
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
            <AgGridReact<TData>
              columnDefs={columnsWithLoading}
              datasource={datasource}
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
              <Tooltip
                label={translations?.footer?.refresh ?? 'Refresh'}
                disabled={refreshDisabled}
              >
                <Button
                  variant="subtle"
                  size="compact-sm"
                  leftSection={<RefreshCw size={14} />}
                  onClick={handleRefresh}
                  disabled={refreshDisabled}
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
            <FilterDrawer<TData>
              opened={filterDrawerOpen}
              onClose={() => setFilterDrawerOpen(false)}
              columns={columnsWithLoading}
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
