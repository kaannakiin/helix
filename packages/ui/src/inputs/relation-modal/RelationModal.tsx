'use client';

import { Button, Group, Input, Loader, Pill, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { RelationModalContent } from './RelationModalContent';
import type { LookupItem, RelationModalProps } from './types';

export function RelationModal(props: RelationModalProps) {
  const {
    fetchOptions,
    queryKey,
    title,
    label,
    description,
    placeholder,
    error,
    required,
    disabled,
    renderOption,
    renderSelected,
    emptyMessage,
    searchDebounce,
  } = props;

  const t = useTranslations('common.relationModal');
  const [opened, { open, close }] = useDisclosure(false);

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

  const handleConfirm = useCallback(
    (ids: string[]) => {
      if (isMultiple) {
        (onChange as (v: string[]) => void)(ids);
      } else {
        (onChange as (v: string | null) => void)(ids[0] ?? null);
      }
    },
    [isMultiple, onChange]
  );

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

  return (
    <>
      <Input.Wrapper
        label={label}
        description={description}
        error={error}
        required={required}
      >
        {resolvedItems.length > 0 && (
          <Group gap={4} mb="xs">
            {resolvedItems.map((item) => (
              <Pill
                key={item.id}
                withRemoveButton={!disabled}
                onRemove={() => handleRemove(item.id)}
                size="sm"
              >
                {renderSelected ? (
                  renderSelected(item)
                ) : (
                  <Text size="xs" span>
                    {item.label}
                  </Text>
                )}
              </Pill>
            ))}
            {resolving && <Loader size={14} />}
          </Group>
        )}

        <Button
          variant="default"
          size="sm"
          leftSection={<Plus size={16} />}
          onClick={open}
          disabled={disabled}
          fullWidth
        >
          {placeholder ?? t('select')}
        </Button>
      </Input.Wrapper>

      <RelationModalContent
        fetchOptions={fetchOptions}
        queryKey={queryKey}
        title={title}
        placeholder={placeholder}
        emptyMessage={emptyMessage}
        searchDebounce={searchDebounce}
        renderOption={renderOption}
        multiple={isMultiple}
        tree={isTree}
        maxItems={maxItems}
        selectedIds={selectedIds}
        onConfirm={handleConfirm}
        opened={opened}
        onClose={close}
        initialSelectedItems={resolvedItems}
      />
    </>
  );
}
