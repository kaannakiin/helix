'use client';

import { Stack, Text } from '@mantine/core';
import type { INoRowsOverlayParams } from 'ag-grid-community';

export interface NoRowsOverlayParams {
  icon?: React.ReactNode;
  label?: string;
}

export function NoRowsOverlay({
  icon,
  label,
}: INoRowsOverlayParams & NoRowsOverlayParams) {
  return (
    <Stack align="center" gap="sm" py="xl" c="dimmed">
      {icon}
      {label && (
        <Text size="sm" fw={500}>
          {label}
        </Text>
      )}
    </Stack>
  );
}

NoRowsOverlay.displayName = 'NoRowsOverlay';
