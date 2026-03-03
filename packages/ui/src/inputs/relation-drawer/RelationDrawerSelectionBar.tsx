'use client';

import { Badge, Button, Group } from '@mantine/core';
import { useTranslations } from 'next-intl';
import { useRelationDrawer } from './context';

export function RelationDrawerSelectionBar() {
  const t = useTranslations('frontend.relationModal');
  const { tempSelectedIds, multiple, clearAll } = useRelationDrawer();

  if (!multiple || tempSelectedIds.size === 0) return null;

  return (
    <Group justify="space-between">
      <Badge variant="light" size="lg">
        {t('selected', { count: tempSelectedIds.size })}
      </Badge>
      <Button variant="subtle" size="xs" color="red" onClick={clearAll}>
        {t('clear')}
      </Button>
    </Group>
  );
}
