'use client';

import { useStoreHostBindings } from '@/core/hooks/useAdminSettings';
import {
  Alert,
  Badge,
  Button,
  Group,
  Paper,
  Stack,
  Text,
} from '@mantine/core';
import { AlertTriangle, ExternalLink, Globe, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

const STATUS_MAP: Record<string, { color: string; key: string }> = {
  ACTIVE: { color: 'green', key: 'live' },
  PENDING_ROUTING: { color: 'yellow', key: 'settingUp' },
  FAILED: { color: 'red', key: 'needsAttention' },
  DISABLED: { color: 'gray', key: 'disabled' },
};

const TYPE_MAP: Record<string, string> = {
  PRIMARY: 'main',
  ALIAS: 'additional',
};

interface StoreDomainStatusCardProps {
  storeId: string;
  storefrontStatus?: string;
}

export function StoreDomainStatusCard({
  storeId,
  storefrontStatus,
}: StoreDomainStatusCardProps) {
  const t = useTranslations('frontend.admin.stores.domains');
  const router = useRouter();
  const { data: bindings } = useStoreHostBindings(storeId);

  return (
    <Stack gap="md">
      {storefrontStatus === 'PENDING_HOST' && (
        <Alert
          icon={<AlertTriangle size={16} />}
          color="yellow"
          variant="light"
        >
          {t('pendingBanner')}
        </Alert>
      )}

      {!bindings?.length ? (
        <Paper withBorder radius="md" p="xl">
          <Stack align="center" gap="md">
            <Globe size={48} strokeWidth={1} color="var(--mantine-color-dimmed)" />
            <Text size="sm" c="dimmed" ta="center">
              {t('empty')}
            </Text>
            <Button
              leftSection={<Plus size={16} />}
              onClick={() =>
                router.push(`/admin/stores/${storeId}/domains/connect`)
              }
            >
              {t('connect')}
            </Button>
          </Stack>
        </Paper>
      ) : (
        <>
          <Stack gap="sm">
            {bindings.map((binding) => {
              const statusInfo = STATUS_MAP[binding.status] ?? {
                color: 'gray',
                key: 'disabled',
              };
              const typeKey = TYPE_MAP[binding.type] ?? 'main';

              return (
                <Paper key={binding.id} withBorder radius="md" p="md">
                  <Group justify="space-between" align="center">
                    <div>
                      <Group gap="xs" align="center">
                        <Text fw={600} size="sm">
                          {binding.hostname}
                        </Text>
                        {binding.status === 'ACTIVE' && (
                          <ExternalLink
                            size={14}
                            color="var(--mantine-color-dimmed)"
                            style={{ cursor: 'pointer' }}
                            onClick={() =>
                              window.open(
                                `https://${binding.hostname}`,
                                '_blank'
                              )
                            }
                          />
                        )}
                      </Group>
                      <Text size="xs" c="dimmed">
                        {t(`type.${typeKey}`)}
                      </Text>
                    </div>

                    <Badge color={statusInfo.color} variant="light" size="sm">
                      {t(`status.${statusInfo.key}`)}
                    </Badge>
                  </Group>
                </Paper>
              );
            })}
          </Stack>

          <Group justify="flex-end">
            <Button
              variant="light"
              size="sm"
              leftSection={<Plus size={14} />}
              onClick={() =>
                router.push(`/admin/stores/${storeId}/domains/connect`)
              }
            >
              {t('connect')}
            </Button>
          </Group>
        </>
      )}
    </Stack>
  );
}
