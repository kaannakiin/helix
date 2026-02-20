'use client';

import { Group, Text } from '@mantine/core';
import { CheckSquare, Database } from 'lucide-react';
import type { DataTableFooterTranslations } from '../types/footer.types';

const DEFAULT_FOOTER_TRANSLATIONS: DataTableFooterTranslations = {
  totalRows: 'Total: {count}',
  selectedRows: 'Selected: {count}',
};

interface DataTableFooterProps {
  totalRows: number | null;
  selectedCount: number;
  translations?: DataTableFooterTranslations;
}

function formatLabel(template: string, count: number): string {
  return template.replace('{count}', count.toLocaleString());
}

export function DataTableFooter({
  totalRows,
  selectedCount,
  translations,
}: DataTableFooterProps) {
  const t = translations ?? DEFAULT_FOOTER_TRANSLATIONS;

  return (
    <Group
      justify="end"
      px="sm"
      py={6}
      style={{
        minHeight: 36,
        flex: 1,
      }}
    >
      <Group gap="xs">
        <Database size={14} style={{ color: 'var(--mantine-color-dimmed)' }} />
        <Text size="sm" c="dimmed">
          {totalRows !== null ? formatLabel(t.totalRows, totalRows) : '—'}
        </Text>
      </Group>

      {selectedCount > 0 && (
        <Group gap="xs">
          <CheckSquare
            size={14}
            style={{ color: 'var(--mantine-primary-color-filled)' }}
          />
          <Text size="sm" fw={500} c="var(--mantine-primary-color-filled)">
            {formatLabel(t.selectedRows, selectedCount)}
          </Text>
        </Group>
      )}
    </Group>
  );
}
