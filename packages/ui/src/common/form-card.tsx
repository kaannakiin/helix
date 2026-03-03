'use client';

import { Card, Divider, Group, Stack, Text, ThemeIcon } from '@mantine/core';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../utils/cn';

export interface FormCardProps {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  rightSection?: ReactNode;
  icon?: LucideIcon;
  iconColor?: string;
  iconVariant?: 'light' | 'outline' | 'filled' | 'transparent' | 'default';
  className?: string;
  withBorder?: boolean;
}

export const FormCard = ({
  title,
  description,
  children,
  rightSection,
  icon: Icon,
  iconColor,
  iconVariant = 'light',
  className,
  withBorder = true,
}: FormCardProps) => {
  return (
    <Card
      withBorder={withBorder}
      shadow="sm"
      radius="md"
      p={0}
      className={cn(className)}
      style={{ overflow: 'visible' }}
    >
      <Stack gap={0}>
        <Group justify="space-between" align="flex-start" p="md">
          <Group align="center" gap="sm">
            {Icon && (
              <ThemeIcon
                variant={iconVariant}
                color={iconColor}
                size="lg"
                radius="md"
              >
                <Icon size={20} />
              </ThemeIcon>
            )}
            <Stack gap={4}>
              <Text fw={600} size="lg">
                {title}
              </Text>
              {description && (
                <Text size="sm" c="dimmed" lh={1.3}>
                  {description}
                </Text>
              )}
            </Stack>
          </Group>
          {rightSection && <div>{rightSection}</div>}
        </Group>

        <Divider />

        <div style={{ padding: 'var(--mantine-spacing-md)' }}>{children}</div>
      </Stack>
    </Card>
  );
};
