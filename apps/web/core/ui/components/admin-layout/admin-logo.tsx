'use client';

import { Group, Text } from '@mantine/core';
import { Hexagon } from 'lucide-react';

interface AdminLogoProps {
  collapsed?: boolean;
}

export function AdminLogo({ collapsed = false }: AdminLogoProps) {
  return (
    <Group gap="xs" wrap="nowrap">
      <Hexagon size={26} color="var(--mantine-color-primary-4)" />
      {!collapsed && (
        <Text fw={700} size="lg">
          Helix
        </Text>
      )}
    </Group>
  );
}
