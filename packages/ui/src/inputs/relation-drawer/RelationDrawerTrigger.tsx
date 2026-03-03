'use client';

import { Button, Group, Input, Loader, Pill, Text } from '@mantine/core';
import dynamic from 'next/dynamic';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRelationDrawer } from './context';
import type { RelationDrawerTriggerProps } from './types';

const LazyGridDisplay = dynamic(
  () =>
    import('./RelationDrawerGridDisplay').then((m) => ({
      default: m.RelationDrawerGridDisplay,
    })),
  { ssr: false }
);

export function RelationDrawerTrigger({
  label,
  description,
  placeholder,
  error,
  required,
  disabled,
  compact,
}: RelationDrawerTriggerProps) {
  const t = useTranslations('common.relationModal');
  const {
    resolvedItems,
    resolving,
    open,
    handleRemove,
    renderSelected,
    display,
    gridDisplayProps,
  } = useRelationDrawer();

  if (compact) {
    return (
      <Button
        variant="default"
        size="sm"
        leftSection={<Plus size={16} />}
        onClick={open}
        disabled={disabled}
      >
        {placeholder ?? t('select')}
      </Button>
    );
  }

  return (
    <Input.Wrapper
      label={label}
      description={description}
      error={error}
      required={required}
    >
      {resolvedItems.length > 0 &&
        (display === 'grid' ? (
          <LazyGridDisplay
            items={resolvedItems}
            onRemove={handleRemove}
            disabled={disabled}
            {...gridDisplayProps}
          />
        ) : (
          <Group gap={4} mb="xs">
            {resolvedItems.map((item) => (
              <Pill
                key={item.id}
                withRemoveButton={!disabled}
                onRemove={() => handleRemove(item.id)}
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
            {resolving && <Loader size={14} />}
          </Group>
        ))}

      <Button
        variant="default"
        size="sm"
        leftSection={<Plus size={16} />}
        onClick={open}
        disabled={disabled}
        fullWidth
      >
        {placeholder ?? t('select')}
      </Button>
    </Input.Wrapper>
  );
}
