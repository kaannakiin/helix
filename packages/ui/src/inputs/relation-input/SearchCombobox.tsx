'use client';

import {
  Combobox,
  Group,
  Loader,
  ScrollArea,
  Text,
  TextInput,
  useCombobox,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { PaginatedResponse } from '@org/types/pagination';
import type { FetchOptions, LookupItem } from './types';

interface SearchComboboxProps {
  queryKey: readonly unknown[];
  fetchOptions: FetchOptions;
  selectedIds: string[];
  onSelect: (item: LookupItem) => void;
  placeholder?: string;
  disabled?: boolean;
  emptyMessage?: string;
  searchDebounce?: number;
  renderOption?: (item: LookupItem) => ReactNode;
  error?: string;
  multiple?: boolean;
}

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

export function SearchCombobox({
  queryKey,
  fetchOptions,
  selectedIds,
  onSelect,
  placeholder = 'Search...',
  disabled = false,
  emptyMessage = 'No results found',
  searchDebounce = 300,
  renderOption,
  error,
  multiple = false,
}: SearchComboboxProps) {
  const t = useTranslations('common.relationInput');
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, searchDebounce);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const combobox = useCombobox({
    onDropdownClose: () => {
      combobox.resetSelectedOption();
    },
    onDropdownOpen: () => {
      combobox.updateSelectedOptionIndex('active');
    },
  });

  const {
    data,
    isLoading: loading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: [...queryKey, 'search', debouncedSearch || ''],
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
    enabled: combobox.dropdownOpened,
    staleTime: 2 * 60 * 1000,
  });

  const options = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data]
  );

  const fetchNextPageRef = useRef(fetchNextPage);
  fetchNextPageRef.current = fetchNextPage;

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

  const handleOptionSubmit = useCallback(
    (val: string) => {
      const item = options.find((o) => o.id === val);
      if (item) {
        onSelect(item);
        setSearch('');
        if (!multiple) {
          combobox.closeDropdown();
        }
      }
    },
    [options, onSelect, combobox, multiple]
  );

  const groupedOptions = useMemo(() => {
    const hasGroups = options.some((o) => o.group);
    if (!hasGroups) {
      return null;
    }

    const groups = new Map<string, LookupItem[]>();
    for (const option of options) {
      const groupName = option.group ?? '';
      if (!groups.has(groupName)) {
        groups.set(groupName, []);
      }
      groups.get(groupName)!.push(option);
    }
    return groups;
  }, [options]);

  const renderItem = useCallback(
    (item: LookupItem) => {
      const isSelected = selectedIds.includes(item.id);

      return (
        <Combobox.Option
          key={item.id}
          value={item.id}
          active={isSelected}
          disabled={isSelected}
        >
          {renderOption ? (
            renderOption(item)
          ) : (
            <Group gap="sm">
              <Text size="sm" opacity={isSelected ? 0.5 : 1}>
                {item.label}
              </Text>
              {isSelected && (
                <Text size="xs" c="dimmed">
                  {t('selected')}
                </Text>
              )}
            </Group>
          )}
        </Combobox.Option>
      );
    },
    [selectedIds, renderOption]
  );

  const renderOptions = () => {
    if (loading) {
      return (
        <Combobox.Empty>
          <Group justify="center" p="xs">
            <Loader size="sm" />
          </Group>
        </Combobox.Empty>
      );
    }

    if (options.length === 0) {
      return <Combobox.Empty>{emptyMessage ?? t('empty')}</Combobox.Empty>;
    }

    if (groupedOptions) {
      return Array.from(groupedOptions.entries()).map(([groupName, items]) => (
        <Combobox.Group key={groupName} label={groupName}>
          {items.map(renderItem)}
        </Combobox.Group>
      ));
    }

    return options.map(renderItem);
  };

  return (
    <Combobox store={combobox} onOptionSubmit={handleOptionSubmit} withinPortal>
      <Combobox.Target>
        <TextInput
          value={search}
          onChange={(e) => {
            setSearch(e.currentTarget.value);
            combobox.openDropdown();
          }}
          onClick={() => combobox.openDropdown()}
          onFocus={() => combobox.openDropdown()}
          onBlur={() => combobox.closeDropdown()}
          placeholder={placeholder ?? t('search')}
          disabled={disabled}
          error={error}
          rightSection={loading ? <Loader size={16} /> : <Search size={16} />}
        />
      </Combobox.Target>

      <Combobox.Dropdown>
        <Combobox.Options>
          <ScrollArea.Autosize mah={250} type="scroll">
            {renderOptions()}
            {hasNextPage && (
              <div ref={sentinelRef}>
                {isFetchingNextPage && (
                  <Group justify="center" p="xs">
                    <Loader size="xs" />
                  </Group>
                )}
              </div>
            )}
          </ScrollArea.Autosize>
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}
