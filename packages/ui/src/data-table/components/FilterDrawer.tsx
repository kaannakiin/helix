"use client";

import {
  Accordion,
  Badge,
  Button,
  Drawer,
  Group,
  ScrollArea,
  Stack,
  Text,
} from "@mantine/core";
import { Filter, Search, Trash2 } from "lucide-react";
import { createElement, useCallback, useEffect, useMemo, useState } from "react";
import type { ColDef } from "ag-grid-community";
import type { DataTableFilterDrawerTranslations } from "../store/data-table-translation-store";

const DEFAULT_DRAWER_TRANSLATIONS: DataTableFilterDrawerTranslations = {
  title: "Filters",
  clearAll: "Clear All",
  activeFilters: "{count} active",
  noFilters: "No filters available",
  apply: "Apply Filters",
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
  columns: ColDef<TData>[],
): FilterColumnInfo[] {
  const result: FilterColumnInfo[] = [];

  for (const col of columns) {
    const field = (col.field ?? col.colId) as string | undefined;
    if (!field) continue;

    const rawFilter = col.filter;
    if (!rawFilter || typeof rawFilter === "boolean" || typeof rawFilter === "string") continue;

    const filter = rawFilter as {
      component?: React.ComponentType<unknown>;
      params?: Record<string, unknown>;
    };
    if (!filter.component) continue;

    result.push({
      field,
      headerName: (col.headerName as string) ?? field,
      filterComponent: filter.component as FilterColumnInfo["filterComponent"],
      filterParams: filter.params,
    });
  }

  return result;
}

function formatActiveLabel(template: string, count: number): string {
  return template.replace("{count}", String(count));
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

  // Local draft state — synced from grid when drawer opens
  const [draftModel, setDraftModel] = useState<Record<string, unknown>>({});

  // Sync draft from grid's filterModel when drawer opens
  useEffect(() => {
    if (opened) {
      setDraftModel({ ...filterModel });
    }
  }, [opened, filterModel]);

  const draftCount = useMemo(
    () => Object.keys(draftModel).length,
    [draftModel],
  );

  const activeCount = useMemo(
    () => Object.keys(filterModel).length,
    [filterModel],
  );

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
    [],
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

  const draftFields = useMemo(
    () => new Set(Object.keys(draftModel)),
    [draftModel],
  );

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
        <ScrollArea style={{ flex: 1 }} offsetScrollbars>
          <Accordion variant="separated" multiple>
            {filterColumns.map((col) => {
              const isActive = draftFields.has(col.field);
              return (
                <Accordion.Item key={col.field} value={col.field}>
                  <Accordion.Control>
                    <Group gap="sm" wrap="nowrap">
                      <Text size="sm" fw={500}>
                        {col.headerName}
                      </Text>
                      {isActive && (
                        <Badge
                          size="xs"
                          variant="dot"
                          color="blue"
                        >
                          {formatActiveLabel(t.activeFilters, 1)}
                        </Badge>
                      )}
                    </Group>
                  </Accordion.Control>
                  <Accordion.Panel>
                    {createElement(col.filterComponent, {
                      model: draftModel[col.field] ?? null,
                      onModelChange: handleLocalFilterChange(col.field),
                      ...col.filterParams,
                    })}
                  </Accordion.Panel>
                </Accordion.Item>
              );
            })}
          </Accordion>
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
