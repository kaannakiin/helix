'use client';

import {
  Badge,
  Box,
  Button,
  Divider,
  Drawer,
  Group,
  Pill,
  ScrollArea,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import type { ColDef } from 'ag-grid-community';
import { Filter, Search, Trash2 } from 'lucide-react';
import {
  createElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { DataTableFilterDrawerTranslations } from '../store/data-table-translation-store';

const DEFAULT_DRAWER_TRANSLATIONS: DataTableFilterDrawerTranslations = {
  title: 'Filters',
  clearAll: 'Clear All',
  activeFilters: '{count} active',
  noFilters: 'No filters available',
  apply: 'Apply Filters',
  searchPlaceholder: 'Search filters...',
  appliedFilters: 'Applied Filters',
};

interface FilterColumnInfo {
  field: string;
  headerName: string;
  filterComponent: React.ComponentType<{
    model: unknown;
    onModelChange: (model: unknown) => void;
    options?: unknown;
    placeholder?: string;
  }>;
  filterParams?: Record<string, unknown>;
}

interface FilterDrawerProps<TData> {
  opened: boolean;
  onClose: () => void;
  columns: ColDef<TData>[];
  filterModel: Record<string, unknown>;
  onApplyFilters: (model: Record<string, unknown>) => void;
  onClearAll: () => void;
  translations?: DataTableFilterDrawerTranslations;
}

function extractFilterColumns<TData>(
  columns: ColDef<TData>[]
): FilterColumnInfo[] {
  const result: FilterColumnInfo[] = [];

  for (const col of columns) {
    const field = (col.field ?? col.colId) as string | undefined;
    if (!field) continue;

    const rawFilter = col.filter;
    if (
      !rawFilter ||
      typeof rawFilter === 'boolean' ||
      typeof rawFilter === 'string'
    )
      continue;

    const filter = rawFilter as {
      component?: React.ComponentType<unknown>;
      params?: Record<string, unknown>;
    };
    if (!filter.component) continue;

    result.push({
      field,
      headerName: (col.headerName as string) ?? field,
      filterComponent: filter.component as FilterColumnInfo['filterComponent'],
      filterParams: filter.params,
    });
  }

  return result;
}

export function FilterDrawer<TData>({
  opened,
  onClose,
  columns,
  filterModel,
  onApplyFilters,
  onClearAll,
  translations,
}: FilterDrawerProps<TData>) {
  const t = translations ?? DEFAULT_DRAWER_TRANSLATIONS;
  const filterColumns = useMemo(() => extractFilterColumns(columns), [columns]);
  const [draftModel, setDraftModel] = useState<Record<string, unknown>>({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (opened) {
      setDraftModel({ ...filterModel });
      setSearchTerm('');
    }
  }, [opened, filterModel]);

  const draftCount = useMemo(
    () => Object.keys(draftModel).length,
    [draftModel]
  );

  const activeCount = useMemo(
    () => Object.keys(filterModel).length,
    [filterModel]
  );

  const visibleColumns = useMemo(() => {
    if (!searchTerm) return filterColumns;
    const term = searchTerm.toLowerCase();
    return filterColumns.filter((col) =>
      col.headerName.toLowerCase().includes(term)
    );
  }, [filterColumns, searchTerm]);

  const handleLocalFilterChange = useCallback(
    (field: string) => (model: unknown) => {
      setDraftModel((prev) => {
        const next = { ...prev };
        if (model === null || model === undefined) {
          delete next[field];
        } else {
          next[field] = model;
        }
        return next;
      });
    },
    []
  );

  const handleApply = useCallback(() => {
    onApplyFilters(draftModel);
    onClose();
  }, [draftModel, onApplyFilters, onClose]);

  const handleClearAll = useCallback(() => {
    setDraftModel({});
    onClearAll();
    onClose();
  }, [onClearAll, onClose]);

  if (filterColumns.length === 0) {
    return (
      <Drawer
        opened={opened}
        onClose={onClose}
        position="right"
        size="sm"
        title={
          <Group gap="sm">
            <Filter size={18} />
            <Text fw={600}>{t.title}</Text>
          </Group>
        }
      >
        <Stack align="center" justify="center" py="xl">
          <Text c="dimmed" size="sm">
            {t.noFilters}
          </Text>
        </Stack>
      </Drawer>
    );
  }

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size="sm"
      title={
        <Group gap="sm">
          <Filter size={18} />
          <Text fw={600}>{t.title}</Text>
          {activeCount > 0 && (
            <Badge size="sm" variant="filled" circle>
              {activeCount}
            </Badge>
          )}
        </Group>
      }
    >
      <Stack gap="md" h="100%" justify="space-between">
        <TextInput
          placeholder={t.searchPlaceholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.currentTarget.value)}
          leftSection={<Search size={14} />}
          size="xs"
        />

        {draftCount > 0 && (
          <Box>
            <Text size="xs" fw={600} c="dimmed" mb={4} tt="uppercase">
              {t.appliedFilters}
            </Text>
            <Group gap="xs" wrap="wrap">
              {Object.keys(draftModel).map((field) => {
                const col = filterColumns.find((c) => c.field === field);
                return (
                  <Pill
                    key={field}
                    size="sm"
                    withRemoveButton
                    onRemove={() => handleLocalFilterChange(field)(null)}
                  >
                    {col?.headerName ?? field}
                  </Pill>
                );
              })}
            </Group>
          </Box>
        )}

        <Divider />

        <ScrollArea style={{ flex: 1 }} offsetScrollbars>
          <Stack gap={0}>
            {visibleColumns.map((col, i) => (
              <Box key={col.field}>
                {i > 0 && <Divider my="xs" />}
                <Text
                  size="xs"
                  fw={600}
                  c="dimmed"
                  px="xs"
                  pt="xs"
                  pb={4}
                  tt="uppercase"
                >
                  {col.headerName}
                </Text>
                {createElement(col.filterComponent, {
                  model: draftModel[col.field] ?? null,
                  onModelChange: handleLocalFilterChange(col.field),
                  ...col.filterParams,
                })}
              </Box>
            ))}
          </Stack>
        </ScrollArea>

        <Stack gap="xs">
          <Button
            leftSection={<Search size={16} />}
            onClick={handleApply}
            fullWidth
          >
            {t.apply}
          </Button>
          {draftCount > 0 && (
            <Button
              variant="light"
              color="red"
              leftSection={<Trash2 size={16} />}
              onClick={handleClearAll}
              fullWidth
            >
              {t.clearAll}
            </Button>
          )}
        </Stack>
      </Stack>
    </Drawer>
  );
}
