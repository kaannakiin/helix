'use client';

import { CloseButton, Group, Input, Loader, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { SearchCombobox } from './SearchCombobox';
import { SelectedItems } from './SelectedItems';
import { SortableItems } from './SortableItems';
import type { LookupItem, RelationInputProps } from './types';

export function RelationInput(props: RelationInputProps) {
  const {
    fetchOptions,
    queryKey,
    label,
    description,
    placeholder,
    error,
    required,
    disabled,
    size,
    w,
    renderOption,
    renderSelected,
    emptyMessage,
    searchDebounce,
  } = props;

  const [localItems, setLocalItems] = useState<LookupItem[]>([]);

  const isMultiple = 'multiple' in props && props.multiple === true;
  const isSortable =
    isMultiple && 'sortable' in props && props.sortable === true;

  const value = isMultiple
    ? (props as { value: string[] }).value
    : (props as { value: string | null }).value;

  const onChange = isMultiple
    ? (props as { onChange: (v: string[]) => void }).onChange
    : (props as { onChange: (v: string | null) => void }).onChange;

  const maxItems = isMultiple
    ? (props as { maxItems?: number }).maxItems
    : undefined;

  const clearable =
    !isMultiple && 'clearable' in props
      ? (props as { clearable?: boolean }).clearable
      : undefined;

  const selectedIds = useMemo(() => {
    if (isMultiple) {
      return value as string[];
    }
    const singleValue = value as string | null;
    return singleValue ? [singleValue] : [];
  }, [isMultiple, value]);

  const missingIds = useMemo(() => {
    const localIdSet = new Set(localItems.map((item) => item.id));
    return selectedIds.filter((id) => !localIdSet.has(id));
  }, [selectedIds, localItems]);

  const missingIdsKey = missingIds.join(',');

  const { data: fetchedItems = [], isLoading: resolving } = useQuery({
    queryKey: [...queryKey, 'resolve', missingIdsKey],
    queryFn: async () => {
      const result = await fetchOptions({ ids: missingIds });

      return Array.isArray(result) ? result : result.items;
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

  const handleSelect = useCallback(
    (item: LookupItem) => {
      if (isMultiple) {
        const multiValue = value as string[];
        const multiOnChange = onChange as (v: string[]) => void;
        if (multiValue.includes(item.id)) return;
        if (maxItems && multiValue.length >= maxItems) return;

        setLocalItems((prev) => {
          if (prev.some((p) => p.id === item.id)) return prev;
          return [...prev, item];
        });
        multiOnChange([...multiValue, item.id]);
      } else {
        const singleOnChange = onChange as (v: string | null) => void;
        setLocalItems([item]);
        singleOnChange(item.id);
      }
    },
    [isMultiple, value, onChange, maxItems]
  );

  const handleRemove = useCallback(
    (id: string) => {
      if (isMultiple) {
        const multiValue = value as string[];
        const multiOnChange = onChange as (v: string[]) => void;
        multiOnChange(multiValue.filter((v) => v !== id));
      } else {
        const singleOnChange = onChange as (v: string | null) => void;
        singleOnChange(null);
      }
    },
    [isMultiple, value, onChange]
  );

  const handleReorder = useCallback(
    (newIds: string[]) => {
      if (isMultiple) {
        const multiOnChange = onChange as (v: string[]) => void;
        multiOnChange(newIds);
      }
    },
    [isMultiple, onChange]
  );

  const handleClear = useCallback(() => {
    if (!isMultiple) {
      const singleOnChange = onChange as (v: string | null) => void;
      singleOnChange(null);
    }
  }, [isMultiple, onChange]);

  if (!isMultiple) {
    const selectedItem = resolvedItems[0] ?? null;
    const hasValue = value && selectedItem;

    return (
      <Input.Wrapper
        label={label}
        description={description}
        error={error}
        required={required}
        size={size}
        w={w}
      >
        {hasValue ? (
          <Group
            gap="xs"
            p="xs"
            style={{
              border: '1px solid var(--mantine-color-default-border)',
              borderRadius: 'var(--mantine-radius-sm)',
              minHeight: 36,
            }}
          >
            <Text size="sm" style={{ flex: 1 }}>
              {renderSelected
                ? renderSelected(selectedItem!)
                : selectedItem!.label}
            </Text>
            {resolving && <Loader size={14} />}
            {clearable && !disabled && (
              <CloseButton size="sm" onClick={handleClear} />
            )}
          </Group>
        ) : (
          <SearchCombobox
            queryKey={queryKey}
            fetchOptions={fetchOptions}
            selectedIds={selectedIds}
            onSelect={handleSelect}
            placeholder={placeholder}
            disabled={disabled}
            emptyMessage={emptyMessage}
            searchDebounce={searchDebounce}
            renderOption={renderOption}
          />
        )}
      </Input.Wrapper>
    );
  }

  return (
    <Input.Wrapper
      label={label}
      description={description}
      error={error}
      required={required}
      size={size}
      w={w}
    >
      <SearchCombobox
        queryKey={queryKey}
        fetchOptions={fetchOptions}
        selectedIds={selectedIds}
        onSelect={handleSelect}
        placeholder={placeholder}
        disabled={disabled}
        emptyMessage={emptyMessage}
        searchDebounce={searchDebounce}
        renderOption={renderOption}
        error={error}
        multiple
      />

      {resolving && (
        <Group justify="center" p="xs">
          <Loader size="sm" />
        </Group>
      )}

      {isSortable ? (
        <SortableItems
          items={resolvedItems}
          onReorder={handleReorder}
          onRemove={handleRemove}
          disabled={disabled}
          renderSelected={renderSelected}
        />
      ) : (
        <SelectedItems
          items={resolvedItems}
          onRemove={handleRemove}
          disabled={disabled}
          renderSelected={renderSelected}
        />
      )}
    </Input.Wrapper>
  );
}
