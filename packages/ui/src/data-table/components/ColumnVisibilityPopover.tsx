'use client';

import {
  Badge,
  Button,
  Checkbox,
  Group,
  Popover,
  ScrollArea,
  Stack,
  Text,
} from '@mantine/core';
import { Columns3 } from 'lucide-react';
import { useState } from 'react';
import type { HideableColumn } from '../hooks/useColumnVisibility';

export interface ColumnVisibilityTranslations {
  title: string;
  showAll: string;
  hiddenCount: string;
}

const DEFAULT_TRANSLATIONS: ColumnVisibilityTranslations = {
  title: 'Columns',
  showAll: 'Show All',
  hiddenCount: '{count} hidden',
};

interface ColumnVisibilityPopoverProps {
  hideableColumns: HideableColumn[];
  hiddenFields: Set<string>;
  onToggle: (field: string) => void;
  onShowAll: () => void;
  translations?: ColumnVisibilityTranslations;
}

export function ColumnVisibilityPopover({
  hideableColumns,
  hiddenFields,
  onToggle,
  onShowAll,
  translations,
}: ColumnVisibilityPopoverProps) {
  const [opened, setOpened] = useState(false);
  const t = translations ?? DEFAULT_TRANSLATIONS;
  const hiddenCount = hiddenFields.size;
  const visibleCount = hideableColumns.length - hiddenCount;

  return (
    <Popover
      opened={opened}
      onChange={setOpened}
      position="top-end"
      shadow="md"
      width={240}
    >
      <Popover.Target>
        <Button
          variant="subtle"
          size="compact-sm"
          leftSection={<Columns3 size={14} />}
          rightSection={
            hiddenCount > 0 ? (
              <Badge size="xs" variant="filled" circle>
                {hiddenCount}
              </Badge>
            ) : undefined
          }
          onClick={() => setOpened((o) => !o)}
        >
          {t.title}
        </Button>
      </Popover.Target>

      <Popover.Dropdown p="xs">
        <Stack gap="xs">
          <ScrollArea.Autosize mah={300}>
            <Stack gap={6}>
              {hideableColumns.map((col) => {
                const isHidden = hiddenFields.has(col.field);
                const isLastVisible = !isHidden && visibleCount <= 1;

                return (
                  <Checkbox
                    key={col.field}
                    label={
                      <Text size="sm" truncate>
                        {col.headerName}
                      </Text>
                    }
                    checked={!isHidden}
                    disabled={isLastVisible}
                    onChange={() => onToggle(col.field)}
                    size="xs"
                  />
                );
              })}
            </Stack>
          </ScrollArea.Autosize>

          {hiddenCount > 0 && (
            <Group justify="space-between" pt={4}>
              <Text size="xs" c="dimmed">
                {t.hiddenCount.replace('{count}', String(hiddenCount))}
              </Text>
              <Button
                variant="light"
                size="compact-xs"
                onClick={onShowAll}
              >
                {t.showAll}
              </Button>
            </Group>
          )}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}
