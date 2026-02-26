'use client';

import {
  Checkbox,
  Group,
  Loader,
  Radio,
  ScrollArea,
  Stack,
  Text,
} from '@mantine/core';
import type { PaginatedResponse } from '@org/types/pagination';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef } from 'react';
import type { FetchOptions, LookupItem } from './types';

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

interface ModalFlatListProps {
  queryKey: readonly unknown[];
  fetchOptions: FetchOptions;
  debouncedSearch: string;
  selectedIds: Set<string>;
  onToggle: (item: LookupItem) => void;
  multiple: boolean;
  renderOption?: (item: LookupItem) => React.ReactNode;
  emptyMessage?: string;
}

export function ModalFlatList({
  queryKey,
  fetchOptions,
  debouncedSearch,
  selectedIds,
  onToggle,
  multiple,
  renderOption,
  emptyMessage,
}: ModalFlatListProps) {
  const t = useTranslations('common.relationModal');
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: [...queryKey, 'modal-search', debouncedSearch || ''],
      queryFn: async ({ pageParam }) => {
        const result = await fetchOptions({
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

  const fetchNextPageRef = useRef(fetchNextPage);
  fetchNextPageRef.current = fetchNextPage;

  const options = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data]
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          fetchNextPageRef.current();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage]);

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
    <ScrollArea.Autosize mah={400} type="scroll">
      <Stack gap={0}>
        {options.map((item) => {
          const isSelected = selectedIds.has(item.id);
          const label = renderOption ? renderOption(item) : item.label;

          return multiple ? (
            <Group
              key={item.id}
              gap="sm"
              p="sm"
              style={{
                cursor: 'pointer',
                backgroundColor: isSelected
                  ? 'var(--mantine-color-blue-light)'
                  : undefined,
              }}
              onClick={() => onToggle(item)}
              wrap="nowrap"
            >
              <Checkbox
                checked={isSelected}
                onChange={() => {}}
                readOnly
                tabIndex={-1}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                {typeof label === 'string' ? (
                  <Text size="sm" truncate>
                    {label}
                  </Text>
                ) : (
                  label
                )}
              </div>
            </Group>
          ) : (
            <Group
              key={item.id}
              gap="sm"
              p="sm"
              style={{
                cursor: 'pointer',
                backgroundColor: isSelected
                  ? 'var(--mantine-color-blue-light)'
                  : undefined,
              }}
              onClick={() => onToggle(item)}
              wrap="nowrap"
            >
              <Radio
                checked={isSelected}
                onChange={() => {}}
                readOnly
                tabIndex={-1}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                {typeof label === 'string' ? (
                  <Text size="sm" truncate>
                    {label}
                  </Text>
                ) : (
                  label
                )}
              </div>
            </Group>
          );
        })}
        {hasNextPage && (
          <div ref={sentinelRef} style={{ padding: '4px 0' }}>
            {isFetchingNextPage && (
              <Group justify="center" p="sm">
                <Loader size="xs" />
              </Group>
            )}
          </div>
        )}
      </Stack>
    </ScrollArea.Autosize>
  );
}
