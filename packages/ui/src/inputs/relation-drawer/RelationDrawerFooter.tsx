'use client';

import { Badge, Button, Divider, Group } from '@mantine/core';
import { useTranslations } from 'next-intl';
import { useRelationDrawer } from './context';

export function RelationDrawerFooter() {
  const t = useTranslations('common.relationModal');
  const { handleConfirm, close, tempSelectedIds, multiple } =
    useRelationDrawer();

  return (
    <>
      <Divider />
      <Group justify="flex-end" gap="sm">
        <Button variant="default" onClick={close}>
          {t('cancel')}
        </Button>
        <Button onClick={handleConfirm}>
          {t('confirm')}
          {multiple && tempSelectedIds.size > 0 && (
            <Badge ml="xs" size="sm" variant="white" circle>
              {tempSelectedIds.size}
            </Badge>
          )}
        </Button>
      </Group>
    </>
  );
}
