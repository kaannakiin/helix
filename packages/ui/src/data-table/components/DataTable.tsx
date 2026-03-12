'use client';

import { Badge, Button, Group, Tooltip } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { DEFAULT_PAGE_SIZE } from '@org/constants';
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
import { AgGridReact } from 'ag-grid-react';
import { Filter, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '../../utils/cn';
import { HELIX_COLUMN_TYPES } from '../columnTypeRegistry';
import {
  DataTableTranslationProvider,
  type DataTableTranslations,
} from '../context/DataTableTranslationContext';
import DataTableProvider from '../data-table-provider';
import { useColumnVisibility } from '../hooks/useColumnVisibility';
import { useContextMenu } from '../hooks/useContextMenu';
import { dataTableTheme } from '../theme';
import type { ContextMenuConfig } from '../types/contextMenu.types';
import { ColumnVisibilityPopover } from './ColumnVisibilityPopover';
import { ContextMenu } from './ContextMenu';
import { DataTableFooter } from './DataTableFooter';
import { FilterDrawer } from './FilterDrawer';
import { createLoadingCellRenderer } from './LoadingCellRenderer';
import { MobileMenuCellRenderer } from './MobileMenuCellRenderer';
import { NoRowsOverlay } from './NoRowsOverlay';

const EMPTY_GRID_OPTIONS = {} as const;
const MOBILE_MENU_COL_ID = '__mobile_menu__';

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
  contextMenu?: ContextMenuConfig<TData>;
  showFilterDrawer?: boolean;
  pageSize?: number;
  contextMenuColumnPosition?: 'left' | 'right';
}

export function DataTable<TData>({
  tableId,
  columns,
  datasource,
  gridOptions = EMPTY_GRID_OPTIONS,
  translations,
  className,
  height = '600px',
  onRowClicked,
  onSelectionChanged,
  contextMenu,
  showFilterDrawer = false,
  pageSize = DEFAULT_PAGE_SIZE,
  contextMenuColumnPosition = 'right',
}: DataTableProps<TData>) {
  const isMobile = useMediaQuery('(pointer: coarse)') ?? false;
  const contextMenuEnabled = contextMenu?.enabled !== false && contextMenu;

  const {
    wrapperRef,
    state: menuState,
    handleCellContextMenu,
    close: closeMenu,
  } = useContextMenu<TData>({ enabled: !!contextMenuEnabled });
  const [selectedRows, setSelectedRows] = useState<TData[]>([]);
  const selectedRowsRef = useRef<TData[]>([]);
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

  const mobileMenuColumn = useMemo<ColDef<TData> | null>(() => {
    if (!isMobile || !contextMenuEnabled) return null;
    return {
      colId: MOBILE_MENU_COL_ID,
      headerName: '',
      sortable: false,
      filter: false,
      resizable: false,
      suppressMovable: true,
      flex: 0,
      width: 56,
      pinned: contextMenuColumnPosition,
      cellRenderer: MobileMenuCellRenderer,
      cellRendererParams: {
        config: contextMenu,
        selectedRowsRef,
        translations: translations?.contextMenu,
      },
      cellStyle: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
    };
  }, [
    isMobile,
    contextMenuEnabled,
    contextMenu,
    contextMenuColumnPosition,
    selectedRowsRef,
    translations,
  ]);

  const columnsWithLoadingAndMenu = useMemo(
    () =>
      mobileMenuColumn
        ? [...columnsWithLoading, mobileMenuColumn]
        : columnsWithLoading,
    [columnsWithLoading, mobileMenuColumn]
  );

  const { hiddenFields, toggleColumn, showAll, hideableColumns, isMounted } =
    useColumnVisibility(tableId, columnsWithLoading);

  useEffect(() => {
    const api = gridApiRef.current;
    if (!api || !isMounted) return;
    const visible: string[] = [];
    const hidden: string[] = [];
    hideableColumns.forEach(({ field }) => {
      (hiddenFields.has(field) ? hidden : visible).push(field);
    });
    if (visible.length) api.setColumnsVisible(visible, true);
    if (hidden.length) api.setColumnsVisible(hidden, false);
  }, [hiddenFields, hideableColumns, isMounted]);

  const handleSelectionChanged = useCallback(
    (event: { api: { getSelectedRows: () => TData[] } }) => {
      const rows = event.api.getSelectedRows();
      setSelectedRows(rows);
      selectedRowsRef.current = rows;
      onSelectionChanged?.(rows);
    },
    [onSelectionChanged]
  );

  const handleModelUpdated = useCallback((event: ModelUpdatedEvent<TData>) => {
    const count = event.api.getDisplayedRowCount();
    setTotalRows(count > 0 ? count : null);
  }, []);

  const handleGridReady = useCallback(
    (event: GridReadyEvent<TData>) => {
      gridApiRef.current = event.api;
      gridOptions.onGridReady?.(event);
    },
    [gridOptions.onGridReady]
  );

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

    api.setFilterModel({});
    api.applyColumnState({ defaultState: { sort: null } });
    setFilterModel({});
    api.setGridOption('datasource', datasource);
    setTimeout(() => api.ensureIndexVisible(0), 0);

    setRefreshDisabled(true);
    refreshTimerRef.current = setTimeout(() => {
      setRefreshDisabled(false);
    }, REFRESH_COOLDOWN_MS);
  }, [refreshDisabled, datasource]);

  const activeFilterCount = Object.keys(filterModel).length;

  const finalGridOptions = useMemo<GridOptions<TData>>(() => {
    const { onGridReady: _consumerOnGridReady, ...restGridOptions } =
      gridOptions;

    const options: GridOptions<TData> = {
      theme: dataTableTheme,
      columnTypes: {
        ...HELIX_COLUMN_TYPES,
        ...(restGridOptions.columnTypes ?? {}),
      },
      rowModelType: 'infinite' as const,
      defaultColDef: {
        sortable: true,
        filter: false,
        resizable: true,
        flex: 1,
        minWidth: 50,
        floatingFilter: false,
        suppressMovable: true,
        ...(showFilterDrawer ? { suppressHeaderFilterButton: true } : {}),
      },
      ...(isMobile ? { rowHeight: 38, headerHeight: 38 } : {}),
      alwaysMultiSort: true,
      pagination: false,
      animateRows: true,
      enableCellTextSelection: true,
      cacheBlockSize: pageSize,
      cacheOverflowSize: 5,
      maxConcurrentDatasourceRequests: 1,
      infiniteInitialRowCount: pageSize,
      maxBlocksInCache: 10,
      reactiveCustomComponents: true,
      overlayComponentSelector: (params) => {
        if (
          params.overlayType === 'noRows' ||
          params.overlayType === 'noMatchingRows'
        ) {
          return {
            component: NoRowsOverlay,
            params: {
              icon: translations?.noRows?.icon,
              label: translations?.noRows?.label,
            },
          };
        }
        return undefined;
      },
      enableFilterHandlers: true,
      localeText: translations?.agGrid,
      cellSelection: false,
      suppressDragLeaveHidesColumns: true,
      suppressContextMenu: true,
      onCellContextMenu:
        contextMenuEnabled && !isMobile
          ? (event: CellContextMenuEvent<TData>) => handleCellContextMenu(event)
          : undefined,
      onBodyScroll:
        contextMenuEnabled && !isMobile ? () => closeMenu() : undefined,
      onRowClicked: onRowClicked
        ? (event) => {
            if (event.data) {
              onRowClicked(event.data);
            }
          }
        : undefined,
      ...restGridOptions,
      onGridReady: handleGridReady,
      onFilterChanged: handleFilterChanged,
      onModelUpdated: handleModelUpdated,
      onSelectionChanged: handleSelectionChanged,
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
    contextMenuEnabled,
    handleCellContextMenu,
    closeMenu,
    showFilterDrawer,
    pageSize,
    isMobile,
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
              columnDefs={columnsWithLoadingAndMenu}
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
              {tableId && (
                <ColumnVisibilityPopover
                  hideableColumns={hideableColumns}
                  hiddenFields={hiddenFields}
                  onToggle={toggleColumn}
                  onShowAll={showAll}
                  translations={translations?.columnVisibility}
                />
              )}
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
          {contextMenuEnabled && !isMobile && (
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
