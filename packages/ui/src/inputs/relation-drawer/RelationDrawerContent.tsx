'use client';

import {
  Badge,
  Button,
  Drawer,
  Group,
  Stack,
  Text,
  useMatches,
} from '@mantine/core';
import { useTranslations } from 'next-intl';
import { RelationDrawerSearch } from './RelationDrawerSearch';
import { RelationDrawerSelectionBar } from './RelationDrawerSelectionBar';
import { useRelationDrawer } from './context';
import type { RelationDrawerContentProps } from './types';

export function RelationDrawerContent({
  title,
  children,
  size,
}: RelationDrawerContentProps) {
  const { opened, close, handleConfirm, tempSelectedIds, multiple } =
    useRelationDrawer();
  const t = useTranslations('common.relationModal');

  const responsiveSize = useMatches({
    base: '100%',
    md: '100%',
    lg: '70%',
  });

  const drawerSize = size ?? responsiveSize;

  return (
    <Drawer.Root
      opened={opened}
      onClose={close}
      position="bottom"
      size={drawerSize}
    >
      <Drawer.Overlay />
      <Drawer.Content
        style={{ borderRadius: '16px 16px 0 0', overflowY: 'hidden' }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden',
          }}
        >
          <Drawer.Header
            style={{
              flex: '0 0 auto',
              flexDirection: 'column',
              alignItems: 'stretch',
              gap: 'var(--mantine-spacing-sm)',
            }}
          >
            <Group justify="space-between" wrap="nowrap">
              <Drawer.Title>
                <Text fw={600} size="lg">
                  {title}
                </Text>
              </Drawer.Title>
              <Group gap="sm" ml="auto">
                <Button variant="default" onClick={close}>
                  {t('cancel')}
                </Button>
                <Button onClick={handleConfirm}>
                  {t('confirm')}
                  {multiple && tempSelectedIds.size > 0 && (
                    <Badge ml="xs" size="xs" variant="white" circle>
                      {tempSelectedIds.size}
                    </Badge>
                  )}
                </Button>
              </Group>
            </Group>
            <RelationDrawerSearch />
            <RelationDrawerSelectionBar />
          </Drawer.Header>
          <Drawer.Body
            style={{
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              flex: 1,
              minHeight: 0,
            }}
          >
            <Stack
              gap="md"
              style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}
            >
              {children}
            </Stack>
          </Drawer.Body>
        </div>
      </Drawer.Content>
    </Drawer.Root>
  );
}
