'use client';

import { useAdminStores, useDeleteStore } from '@/core/hooks/useAdminStores';
import {
  Badge,
  Button,
  Card,
  Group,
  Menu,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import {
  buildColorMap,
  BusinessModelConfigs,
  StorefrontStatusConfigs,
  StoreStatusConfigs,
} from '@org/constants/enum-configs';
import type { Store } from '@org/prisma/browser';
import LoadingOverlay from '@org/ui/common/loading-overlay';
import {
  MoreVertical,
  Pencil,
  Plus,
  Store as StoreIcon,
  Trash2,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

const storeStatusColors = buildColorMap(StoreStatusConfigs);
const businessModelColors = buildColorMap(BusinessModelConfigs);
const storefrontStatusColors = buildColorMap(StorefrontStatusConfigs);

function StoreCard({
  store,
  t,
  tEnums,
  onEdit,
  onDelete,
}: {
  store: Store;
  t: ReturnType<typeof useTranslations>;
  tEnums: ReturnType<typeof useTranslations>;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card
      withBorder
      radius="md"
      padding="lg"
      style={{ cursor: 'pointer' }}
      onClick={onEdit}
    >
      <Stack gap="sm">
        <Group justify="space-between" align="flex-start">
          <div>
            <Text fw={600} size="lg">
              {store.name}
            </Text>
            <Text size="sm" c="dimmed">
              {store.slug}
            </Text>
          </div>
          <Menu position="bottom-end" withArrow>
            <Menu.Target>
              <Button
                variant="subtle"
                size="xs"
                px={4}
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical size={16} />
              </Button>
            </Menu.Target>
            <Menu.Dropdown onClick={(e) => e.stopPropagation()}>
              <Menu.Item leftSection={<Pencil size={14} />} onClick={onEdit}>
                {t('card.edit')}
              </Menu.Item>
              <Menu.Item
                leftSection={<Trash2 size={14} />}
                color="red"
                onClick={onDelete}
              >
                {t('card.delete')}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>

        <Group gap="xs">
          <Badge
            color={businessModelColors[store.businessModel]}
            variant="light"
          >
            {tEnums(`businessModel.${store.businessModel}`)}
          </Badge>
          <Badge color={storeStatusColors[store.status]} variant="light">
            {tEnums(`storeStatus.${store.status}`)}
          </Badge>
          <Badge
            color={storefrontStatusColors[store.storefrontStatus]}
            variant="light"
          >
            {tEnums(`storefrontStatus.${store.storefrontStatus}`)}
          </Badge>
        </Group>

        <SimpleGrid cols={3} spacing="xs">
          <div>
            <Text size="xs" c="dimmed">
              {t('card.locale')}
            </Text>
            <Text size="sm" fw={500}>
              {store.defaultLocale}
            </Text>
          </div>
          <div>
            <Text size="xs" c="dimmed">
              {t('card.currency')}
            </Text>
            <Text size="sm" fw={500}>
              {store.currency}
            </Text>
          </div>
          <div>
            <Text size="xs" c="dimmed">
              {t('card.createdAt')}
            </Text>
            <Text size="sm" fw={500}>
              {new Date(store.createdAt).toLocaleDateString()}
            </Text>
          </div>
        </SimpleGrid>
      </Stack>
    </Card>
  );
}

export default function StoresPage() {
  const t = useTranslations('frontend.admin.stores');
  const tEnums = useTranslations('frontend.enums');
  const router = useRouter();
  const { data: stores, isLoading } = useAdminStores();

  const deleteStore = useDeleteStore({
    onSuccess: () =>
      notifications.show({ color: 'green', message: t('card.deleteSuccess') }),
    onError: () =>
      notifications.show({ color: 'red', message: t('card.deleteError') }),
  });

  if (isLoading) return <LoadingOverlay />;

  if (!stores?.length) {
    return (
      <Stack
        align="center"
        justify="center"
        style={{ minHeight: '60vh' }}
        gap="lg"
      >
        <ThemeIcon size={80} radius="xl" variant="light" color="blue">
          <StoreIcon size={40} />
        </ThemeIcon>
        <Title order={2}>{t('empty.title')}</Title>
        <Text c="dimmed" maw={400} ta="center">
          {t('empty.description')}
        </Text>
        <Button
          size="lg"
          leftSection={<Plus size={20} />}
          onClick={() => router.push('/admin/stores/new')}
        >
          {t('empty.cta')}
        </Button>
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={2}>{t('title')}</Title>
          <Text c="dimmed" mt="xs">
            {t('subtitle')}
          </Text>
        </div>
        <Button
          leftSection={<Plus size={16} />}
          onClick={() => router.push('/admin/stores/new')}
        >
          {t('new')}
        </Button>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
        {stores.map((store) => (
          <StoreCard
            key={store.id}
            store={store}
            t={t}
            tEnums={tEnums}
            onEdit={() => router.push(`/admin/stores/${store.id}`)}
            onDelete={() => {
              modals.openConfirmModal({
                title: t('card.delete'),
                children: <Text size="sm">{t('card.deleteConfirm')}</Text>,
                labels: {
                  confirm: t('card.delete'),
                  cancel: t('form.discard'),
                },
                confirmProps: { color: 'red' },
                onConfirm: () => deleteStore.mutate(store.id),
              });
            }}
          />
        ))}
      </SimpleGrid>
    </Stack>
  );
}
