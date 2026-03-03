'use client';

import { Checkbox, Group, Loader, Radio, Text } from '@mantine/core';
import type { PaginatedResponse } from '@org/types/pagination';
import { useInfiniteQuery } from '@tanstack/react-query';
import type {
  BodyScrollEndEvent,
  GridApi,
  GridReadyEvent,
  ICellRendererParams,
} from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import DataTableProvider from '../../data-table/data-table-provider';
import { drawerListTheme } from '../../data-table/theme';
import { useRelationDrawer } from './context';
import type { DrawerFlatListProps, FetchOptions, LookupItem } from './types';

interface NormalizedPage {
  items: LookupItem[];
  hasMore: boolean;
}

function normalizePage(
  result: LookupItem[] | PaginatedResponse<LookupItem>
): NormalizedPage {
  if (Array.isArray(result)) {
    return { items: result, hasMore: false };
  }
  return {
    items: result.data,
    hasMore: result.pagination.page < result.pagination.totalPages,
  };
}

const DUMMY_COL = [{ colId: '__fw__', headerName: '' }];

export function DrawerFlatList({
  renderItem: renderItemProp,
}: DrawerFlatListProps) {
  const t = useTranslations('frontend.relationModal');
  const {
    queryKey,
    fetchOptions,
    debouncedSearch,
    tempSelectedIds,
    toggleItem,
    multiple,
    maxItems,
    renderItem: renderItemCtx,
    emptyMessage,
  } = useRelationDrawer();

  const renderItem = renderItemProp ?? renderItemCtx;
  const gridApiRef = useRef<GridApi<LookupItem> | null>(null);
  const hasNextPageRef = useRef(false);
  const isFetchingRef = useRef(false);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: [...queryKey, 'drawer-search', debouncedSearch || ''],
      queryFn: async ({ pageParam }) => {
        const result = await (fetchOptions as FetchOptions)({
          q: debouncedSearch || undefined,
          page: pageParam,
        });
        return normalizePage(result);
      },
      initialPageParam: 1,
      getNextPageParam: (lastPage, _allPages, lastPageParam) =>
        lastPage.hasMore ? lastPageParam + 1 : undefined,
      staleTime: 2 * 60 * 1000,
    });

  hasNextPageRef.current = hasNextPage ?? false;
  isFetchingRef.current = isFetchingNextPage;

  const fetchNextPageRef = useRef(fetchNextPage);
  fetchNextPageRef.current = fetchNextPage;

  const options = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data]
  );

  const optimisticIdsRef = useRef(new Set<string>());
  useEffect(() => {
    optimisticIdsRef.current = new Set(tempSelectedIds);
  }, [tempSelectedIds]);

  const toggleItemRef = useRef(toggleItem);
  toggleItemRef.current = toggleItem;
  const renderItemRef = useRef(renderItem);
  renderItemRef.current = renderItem;

  const handleGridReady = useCallback((event: GridReadyEvent<LookupItem>) => {
    gridApiRef.current = event.api;
  }, []);

  const handleRowClick = useCallback(
    (item: LookupItem) => {
      const optimistic = optimisticIdsRef.current;
      if (optimistic.has(item.id)) {
        optimistic.delete(item.id);
      } else {
        if (!multiple) optimistic.clear();
        if (maxItems && optimistic.size >= maxItems) return;
        optimistic.add(item.id);
      }

      const api = gridApiRef.current;
      if (api) {
        const node = api.getRowNode(item.id);
        if (node) {
          api.redrawRows({ rowNodes: [node] });
        }
      }

      toggleItemRef.current(item);
    },
    [multiple, maxItems]
  );

  const fullWidthCellRenderer = useCallback(
    (params: ICellRendererParams<LookupItem>) => {
      if (!params.data) return null;
      const item = params.data;
      const isSelected = optimisticIdsRef.current.has(item.id);
      const ri = renderItemRef.current;
      const content = ri ? ri(item) : item.label;

      return (
        <Group
          gap="sm"
          px="sm"
          wrap="nowrap"
          style={{
            height: '100%',
            width: '100%',
            cursor: 'pointer',
            backgroundColor: isSelected
              ? 'var(--mantine-color-blue-light)'
              : undefined,
          }}
          align="center"
          onClick={() => handleRowClick(item)}
        >
          {multiple ? (
            <Checkbox checked={isSelected} readOnly tabIndex={-1} />
          ) : (
            <Radio checked={isSelected} readOnly tabIndex={-1} />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            {typeof content === 'string' ? (
              <Text size="sm" truncate>
                {content}
              </Text>
            ) : (
              content
            )}
          </div>
        </Group>
      );
    },
    [multiple, handleRowClick]
  );

  const onBodyScrollEnd = useCallback((event: BodyScrollEndEvent) => {
    if (
      event.direction === 'vertical' &&
      hasNextPageRef.current &&
      !isFetchingRef.current
    ) {
      fetchNextPageRef.current();
    }
  }, []);

  const gridOptions = useMemo(
    () => ({
      theme: drawerListTheme,
      rowModelType: 'clientSide' as const,
      headerHeight: 0,
      rowHeight: 48,
      reactiveCustomComponents: true,
      isFullWidthRow: () => true,
      fullWidthCellRenderer,
      getRowId: (params: { data: LookupItem }) => params.data.id,
      suppressNoRowsOverlay: true,
      suppressHorizontalScroll: true,
      onGridReady: handleGridReady,
      onBodyScrollEnd,
    }),
    [fullWidthCellRenderer, onBodyScrollEnd, handleGridReady]
  );

  if (isLoading) {
    return (
      <Group justify="center" p="xl">
        <Loader size="sm" />
      </Group>
    );
  }

  if (options.length === 0) {
    return (
      <Text c="dimmed" ta="center" p="xl" size="sm">
        {emptyMessage ?? t('empty')}
      </Text>
    );
  }

  return (
    <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
      <DataTableProvider>
        <div style={{ height: '100%', width: '100%' }}>
          <AgGridReact<LookupItem>
            columnDefs={DUMMY_COL}
            rowData={options}
            gridOptions={gridOptions}
          />
        </div>
      </DataTableProvider>
      {isFetchingNextPage && (
        <Group justify="center" p="xs">
          <Loader size="xs" />
        </Group>
      )}
    </div>
  );
}
