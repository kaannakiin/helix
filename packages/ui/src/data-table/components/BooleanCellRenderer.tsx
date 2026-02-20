import { ThemeIcon } from '@mantine/core';
import type { ICellRendererParams } from 'ag-grid-community';
import { CheckCheckIcon, XIcon } from 'lucide-react';

export function BooleanCellRenderer({ value }: ICellRendererParams) {
  if (value === null || value === undefined) return null;

  return (
    <ThemeIcon color={value ? 'green' : 'red'} size="sm">
      {value ? <CheckCheckIcon /> : <XIcon />}
    </ThemeIcon>
  );
}
