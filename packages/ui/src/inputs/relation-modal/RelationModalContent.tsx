'use client';

import {
  Badge,
  Button,
  Divider,
  Group,
  Modal,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { ModalFlatList } from './ModalFlatList';
import { ModalTreeList } from './ModalTreeList';
import type { FetchOptions, LookupItem, TreeFetchOptions } from './types';

interface RelationModalContentProps {
  fetchOptions: FetchOptions | TreeFetchOptions;
  queryKey: readonly unknown[];
  title: string;
  placeholder?: string;
  emptyMessage?: string;
  searchDebounce?: number;
  renderOption?: (item: LookupItem) => React.ReactNode;

  multiple: boolean;
  tree: boolean;
  maxItems?: number;

  selectedIds: string[];
  onConfirm: (ids: string[]) => void;

  opened: boolean;
  onClose: () => void;
  initialSelectedItems?: LookupItem[];
}

export function RelationModalContent({
  fetchOptions,
  queryKey,
  title,
  placeholder,
  emptyMessage,
  searchDebounce = 300,
  renderOption,
  multiple,
  tree,
  maxItems,
  selectedIds: externalSelectedIds,
  onConfirm,
  opened,
  onClose,
  initialSelectedItems,
}: RelationModalContentProps) {
  const t = useTranslations('common.relationModal');

  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, searchDebounce);

  const [tempSelectedIds, setTempSelectedIds] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    if (opened) {
      setTempSelectedIds(new Set(externalSelectedIds));
      setSearch('');
    }
  }, [opened, externalSelectedIds]);

  const handleToggle = useCallback(
    (item: LookupItem) => {
      setTempSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(item.id)) {
          next.delete(item.id);
        } else {
          if (!multiple) {
            next.clear();
          }
          if (maxItems && next.size >= maxItems) return prev;
          next.add(item.id);
        }
        return next;
      });
    },
    [multiple, maxItems]
  );

  const handleConfirm = useCallback(() => {
    onConfirm(Array.from(tempSelectedIds));
    onClose();
  }, [tempSelectedIds, onConfirm, onClose]);

  const handleClearAll = useCallback(() => {
    setTempSelectedIds(new Set());
  }, []);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Text fw={600} size="lg">
          {title}
        </Text>
      }
      size="lg"
      padding="xl"
      centered
    >
      <Stack gap="md">
        <TextInput
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          placeholder={placeholder ?? t('search')}
          leftSection={<Search size={16} />}
          rightSection={
            search ? (
              <X
                size={14}
                style={{ cursor: 'pointer' }}
                onClick={() => setSearch('')}
              />
            ) : null
          }
          variant="filled"
        />

        {multiple && tempSelectedIds.size > 0 && (
          <Group justify="space-between">
            <Badge variant="light" size="lg">
              {t('selected', { count: tempSelectedIds.size })}
            </Badge>
            <Button
              variant="subtle"
              size="xs"
              color="red"
              onClick={handleClearAll}
            >
              {t('clear')}
            </Button>
          </Group>
        )}

        {tree ? (
          <ModalTreeList
            queryKey={queryKey}
            fetchOptions={fetchOptions as TreeFetchOptions}
            debouncedSearch={debouncedSearch}
            selectedIds={tempSelectedIds}
            onToggle={handleToggle}
            renderOption={renderOption}
            emptyMessage={emptyMessage}
            initialSelectedItems={initialSelectedItems}
          />
        ) : (
          <ModalFlatList
            queryKey={queryKey}
            fetchOptions={fetchOptions as FetchOptions}
            debouncedSearch={debouncedSearch}
            selectedIds={tempSelectedIds}
            onToggle={handleToggle}
            multiple={multiple}
            renderOption={renderOption}
            emptyMessage={emptyMessage}
          />
        )}

        <Divider />

        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button onClick={handleConfirm}>
            {t('confirm')}
            {multiple && tempSelectedIds.size > 0 && (
              <Badge ml="xs" size="sm" variant="white" circle>
                {tempSelectedIds.size}
              </Badge>
            )}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
