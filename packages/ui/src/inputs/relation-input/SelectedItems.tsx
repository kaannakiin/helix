'use client';

import { Group, Pill, Text } from '@mantine/core';
import type { ReactNode } from 'react';
import type { LookupItem } from './types';

interface SelectedItemsProps {
  items: LookupItem[];
  onRemove: (id: string) => void;
  disabled?: boolean;
  renderSelected?: (item: LookupItem) => ReactNode;
}

export function SelectedItems({
  items,
  onRemove,
  disabled = false,
  renderSelected,
}: SelectedItemsProps) {
  if (items.length === 0) return null;

  return (
    <Group gap={4} mt="xs">
      {items.map((item) => (
        <Pill
          key={item.id}
          withRemoveButton={!disabled}
          onRemove={() => onRemove(item.id)}
          size="sm"
        >
          {renderSelected ? (
            renderSelected(item)
          ) : (
            <Text size="xs" span>
              {item.label}
            </Text>
          )}
        </Pill>
      ))}
    </Group>
  );
}
