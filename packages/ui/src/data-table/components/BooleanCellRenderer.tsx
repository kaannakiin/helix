import { ThemeIcon } from '@mantine/core';
import type { ICellRendererParams } from 'ag-grid-community';
import { CheckIcon, XIcon } from 'lucide-react';

export function BooleanCellRenderer({ value }: ICellRendererParams) {
  if (value === null || value === undefined) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
      }}
    >
      <ThemeIcon color={value ? 'green' : 'red'} size="sm">
        {value ? <CheckIcon /> : <XIcon />}
      </ThemeIcon>
    </div>
  );
}
