'use client';

import {
  useDeleteDomainSpace,
  useDeleteStoreHostBinding,
  useDomainSpaces,
  usePlatformInstallation,
  useStoreHostBindings,
} from '@/core/hooks/useAdminSettings';
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Group,
  Paper,
  Stack,
  Text,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import {
  AlertTriangle,
  Clock,
  ExternalLink,
  Globe,
  Plus,
  Settings,
  Trash2,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

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
  const { data: allDomainSpaces } = useDomainSpaces();
  const { data: installation } = usePlatformInstallation();
  const hasIngress = !!installation?.ingress;

  const deleteBinding = useDeleteStoreHostBinding({
    storeId,
    onSuccess: () =>
      notifications.show({
        color: 'green',
        message: t('deleteBindingSuccess'),
      }),
    onError: () =>
      notifications.show({
        color: 'red',
        message: t('deleteBindingError'),
      }),
  });

  const deleteDomainSpace = useDeleteDomainSpace({
    onSuccess: () =>
      notifications.show({
        color: 'green',
        message: t('deleteDomainSpaceSuccess'),
      }),
    onError: () =>
      notifications.show({
        color: 'red',
        message: t('deleteDomainSpaceError'),
      }),
  });

  const pendingDomainSpaces = useMemo(() => {
    if (!allDomainSpaces) return [];
    return allDomainSpaces.filter((ds) => {
      if (ds.status === 'ARCHIVED') return false;
      const hasActiveBindingForStore = ds.hostBindings.some(
        (b) => b.storeId === storeId && b.status === 'ACTIVE',
      );
      if (hasActiveBindingForStore) return false;
      const hasPendingBindingForStore = ds.hostBindings.some(
        (b) => b.storeId === storeId && b.status !== 'ACTIVE',
      );
      return (
        ds.ownership.status !== 'VERIFIED' ||
        hasPendingBindingForStore
      );
    });
  }, [allDomainSpaces, storeId]);

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

      {!hasIngress && (
        <Alert icon={<Settings size={16} />} color="orange" variant="light">
          <Text size="sm">{t('ingressRequired')}</Text>
          <Button
            variant="light"
            color="orange"
            size="xs"
            mt="sm"
            onClick={() => router.push('/admin/settings/platform')}
          >
            {t('goToSettings')}
          </Button>
        </Alert>
      )}

      {pendingDomainSpaces.length > 0 && (
        <Stack gap="sm">
          <Text size="sm" fw={500} c="dimmed">
            {t('pendingSetups')}
          </Text>
          {pendingDomainSpaces.map((ds) => (
            <Paper
              key={ds.id}
              withBorder
              radius="md"
              p="md"
              style={{
                borderColor: 'var(--mantine-color-yellow-4)',
                backgroundColor: 'var(--mantine-color-yellow-0)',
              }}
            >
              <Group justify="space-between" align="center">
                <div>
                  <Group gap="xs" align="center">
                    <Clock
                      size={14}
                      color="var(--mantine-color-yellow-6)"
                    />
                    <Text fw={600} size="sm">
                      {ds.baseDomain}
                    </Text>
                  </Group>
                  <Text size="xs" c="dimmed">
                    {t('pendingSetupDescription')}
                  </Text>
                </div>
                <Group gap="xs">
                  <Button
                    variant="light"
                    color="yellow"
                    size="xs"
                    onClick={() =>
                      router.push(
                        `/admin/stores/${storeId}/domains/connect?domain=${ds.baseDomain}`,
                      )
                    }
                  >
                    {t('resumeSetup')}
                  </Button>
                  <ActionIcon
                    variant="light"
                    color="red"
                    size="sm"
                    onClick={() =>
                      modals.openConfirmModal({
                        title: t('deleteDomainSpace'),
                        children: (
                          <Text size="sm">
                            {t('deleteDomainSpaceConfirm')}
                          </Text>
                        ),
                        labels: {
                          confirm: t('deleteDomainSpace'),
                          cancel: t('cancel'),
                        },
                        confirmProps: { color: 'red' },
                        onConfirm: () => deleteDomainSpace.mutate(ds.id),
                      })
                    }
                  >
                    <Trash2 size={14} />
                  </ActionIcon>
                </Group>
              </Group>
            </Paper>
          ))}
          {!bindings?.length && (
            <Group justify="flex-end">
              <Button
                variant="light"
                size="sm"
                disabled={!hasIngress}
                leftSection={<Plus size={14} />}
                onClick={() =>
                  router.push(`/admin/stores/${storeId}/domains/connect`)
                }
              >
                {t('connect')}
              </Button>
            </Group>
          )}
        </Stack>
      )}

      {!bindings?.length && !pendingDomainSpaces.length && (
        <Paper withBorder radius="md" p="xl">
          <Stack align="center" gap="md">
            <Globe size={48} strokeWidth={1} color="var(--mantine-color-dimmed)" />
            <Text size="sm" c="dimmed" ta="center">
              {t('empty')}
            </Text>
            <Button
              leftSection={<Plus size={16} />}
              disabled={!hasIngress}
              onClick={() =>
                router.push(`/admin/stores/${storeId}/domains/connect`)
              }
            >
              {t('connect')}
            </Button>
          </Stack>
        </Paper>
      )}

      {!!bindings?.length && (
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

                    <Group gap="xs">
                      <Badge color={statusInfo.color} variant="light" size="sm">
                        {t(`status.${statusInfo.key}`)}
                      </Badge>
                      <ActionIcon
                        variant="light"
                        color="red"
                        size="sm"
                        onClick={() =>
                          modals.openConfirmModal({
                            title: t('deleteBinding'),
                            children: (
                              <Text size="sm">
                                {t('deleteBindingConfirm')}
                              </Text>
                            ),
                            labels: {
                              confirm: t('deleteBinding'),
                              cancel: t('cancel'),
                            },
                            confirmProps: { color: 'red' },
                            onConfirm: () =>
                              deleteBinding.mutate(binding.id),
                          })
                        }
                      >
                        <Trash2 size={14} />
                      </ActionIcon>
                    </Group>
                  </Group>
                </Paper>
              );
            })}
          </Stack>

          <Group justify="flex-end">
            <Button
              variant="light"
              size="sm"
              disabled={!hasIngress}
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
