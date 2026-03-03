'use client';

import { useDebouncedValue, useDisclosure } from '@mantine/hooks';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { RelationDrawerContext } from './context';
import type { LookupItem, RelationDrawerRootProps } from './types';

export function RelationDrawerRoot(props: RelationDrawerRootProps) {
  const {
    fetchOptions,
    queryKey,
    children,
    searchDebounce = 300,
    renderItem,
    renderSelected,
    emptyMessage,
    display = 'pill',
    gridDisplayProps,
  } = props;

  const isMultiple = 'multiple' in props && props.multiple === true;
  const isTree = 'tree' in props && props.tree === true;
  const maxItems =
    isMultiple && 'maxItems' in props ? props.maxItems : undefined;

  const value = isMultiple
    ? (props as { value: string[] }).value
    : (props as { value: string | null }).value;

  const onChange = isMultiple
    ? (props as { onChange: (v: string[]) => void }).onChange
    : (props as { onChange: (v: string | null) => void }).onChange;

  const selectedIds = useMemo(() => {
    if (isMultiple) return value as string[];
    const singleValue = value as string | null;
    return singleValue ? [singleValue] : [];
  }, [isMultiple, value]);

  const [opened, { open, close }] = useDisclosure(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, searchDebounce);

  const [tempSelectedIds, setTempSelectedIds] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    if (opened) {
      setTempSelectedIds(new Set(selectedIds));
      setSearch('');
    }
  }, [opened, selectedIds]);

  const [localItems, setLocalItems] = useState<LookupItem[]>([]);

  const missingIds = useMemo(() => {
    const localIdSet = new Set(localItems.map((item) => item.id));
    return selectedIds.filter((id) => !localIdSet.has(id));
  }, [selectedIds, localItems]);

  const { data: fetchedItems = [], isLoading: resolving } = useQuery({
    queryKey: [...queryKey, 'resolve', missingIds.join(',')],
    queryFn: async () => {
      const result = await fetchOptions({ ids: missingIds });
      if (Array.isArray(result)) return result;
      return 'data' in result ? result.data : [];
    },
    enabled: missingIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (fetchedItems.length > 0) {
      setLocalItems((prev) => {
        const existingIds = new Set(prev.map((item) => item.id));
        const newItems = fetchedItems.filter(
          (item) => !existingIds.has(item.id)
        );
        return newItems.length > 0 ? [...prev, ...newItems] : prev;
      });
    }
  }, [fetchedItems]);

  const resolvedItems = useMemo(() => {
    const all = [...fetchedItems, ...localItems];
    const seen = new Set<string>();
    const deduped: LookupItem[] = [];
    for (const item of all) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        deduped.push(item);
      }
    }
    return selectedIds
      .map((id) => deduped.find((item) => item.id === id))
      .filter(Boolean) as LookupItem[];
  }, [selectedIds, fetchedItems, localItems]);

  const toggleItem = useCallback(
    (item: LookupItem) => {
      setTempSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(item.id)) {
          next.delete(item.id);
        } else {
          if (!isMultiple) {
            next.clear();
          }
          if (maxItems && next.size >= maxItems) return prev;
          next.add(item.id);
        }
        return next;
      });

      setLocalItems((prev) => {
        if (prev.some((i) => i.id === item.id)) return prev;
        return [...prev, item];
      });
    },
    [isMultiple, maxItems]
  );

  const clearAll = useCallback(() => {
    setTempSelectedIds(new Set());
  }, []);

  const handleConfirm = useCallback(() => {
    const ids = Array.from(tempSelectedIds);
    if (isMultiple) {
      (onChange as (v: string[]) => void)(ids);
    } else {
      (onChange as (v: string | null) => void)(ids[0] ?? null);
    }
    close();
  }, [tempSelectedIds, isMultiple, onChange, close]);

  const handleRemove = useCallback(
    (id: string) => {
      if (isMultiple) {
        const multiValue = value as string[];
        (onChange as (v: string[]) => void)(multiValue.filter((v) => v !== id));
      } else {
        (onChange as (v: string | null) => void)(null);
      }
    },
    [isMultiple, value, onChange]
  );

  const contextValue = useMemo(
    () => ({
      queryKey,
      fetchOptions,
      multiple: isMultiple,
      tree: isTree,
      maxItems,
      opened,
      open,
      close,
      search,
      setSearch,
      debouncedSearch,
      tempSelectedIds,
      toggleItem,
      clearAll,
      selectedIds,
      resolvedItems,
      resolving,
      handleConfirm,
      handleRemove,
      renderItem,
      renderSelected,
      emptyMessage,
      display,
      gridDisplayProps,
    }),
    [
      queryKey,
      fetchOptions,
      isMultiple,
      isTree,
      maxItems,
      opened,
      open,
      close,
      search,
      debouncedSearch,
      tempSelectedIds,
      toggleItem,
      clearAll,
      selectedIds,
      resolvedItems,
      resolving,
      handleConfirm,
      handleRemove,
      renderItem,
      renderSelected,
      emptyMessage,
      display,
      gridDisplayProps,
    ]
  );

  return (
    <RelationDrawerContext.Provider value={contextValue}>
      {children}
    </RelationDrawerContext.Provider>
  );
}
