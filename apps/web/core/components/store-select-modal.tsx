'use client';

import { useAdminStores } from '@/core/hooks/useAdminStores';
import {
  Badge,
  Button,
  Group,
  Loader,
  Modal,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
  UnstyledButton,
} from '@mantine/core';
import type { StoreContext } from '@org/types/store';
import { Building2, Check, ShoppingBag } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

interface Props {
  onSelect: (store: StoreContext) => void;
}

export function StoreSelectModal({ onSelect }: Props) {
  const t = useTranslations('frontend.admin.storeSelect');
  const { data: stores, isLoading } = useAdminStores();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const b2bStores = stores?.filter((s) => s.businessModel === 'B2B') ?? [];
  const b2cStores = stores?.filter((s) => s.businessModel === 'B2C') ?? [];

  const handleConfirm = () => {
    const store = stores?.find((s) => s.id === selectedId);
    if (!store) return;
    onSelect({
      storeId: store.id,
      businessModel: store.businessModel,
      slug: store.slug,
    });
  };

  return (
    <Modal
      opened
      onClose={() => {}}
      withCloseButton={false}
      closeOnClickOutside={false}
      closeOnEscape={false}
      size="xl"
      padding="xl"
      centered
      title={
        <Group gap="sm">
          <Text fw={700} size="lg">
            {t('title')}
          </Text>
        </Group>
      }
    >
      {isLoading ? (
        <Stack align="center" py="xl">
          <Loader />
          <Text c="dimmed" size="sm">
            {t('loading')}
          </Text>
        </Stack>
      ) : (
        <Stack gap="xl">
          {b2bStores.length > 0 && (
            <Stack gap="sm">
              <Group gap="xs">
                <Building2 size={18} />
                <Title order={5}>{t('b2b_section')}</Title>
              </Group>
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm">
                {b2bStores.map((store) => {
                  const isSelected = selectedId === store.id;
                  return (
                    <UnstyledButton
                      key={store.id}
                      onClick={() => setSelectedId(store.id)}
                      style={{
                        border: `2px solid ${
                          isSelected
                            ? 'var(--mantine-color-blue-6)'
                            : 'var(--mantine-color-default-border)'
                        }`,
                        borderRadius: 'var(--mantine-radius-md)',
                        padding: 'var(--mantine-spacing-md)',
                        backgroundColor: isSelected
                          ? 'var(--mantine-color-blue-light)'
                          : 'var(--mantine-color-body)',
                        transition: 'all 150ms ease',
                      }}
                    >
                      <Stack gap="xs">
                        <Group justify="space-between" align="flex-start">
                          <Text fw={600} size="sm" lineClamp={2}>
                            {store.name}
                          </Text>
                          {isSelected && (
                            <ThemeIcon
                              size={18}
                              variant="filled"
                              color="blue"
                              radius="xl"
                            >
                              <Check size={12} />
                            </ThemeIcon>
                          )}
                        </Group>
                        <Badge size="xs" variant="light" color="blue">
                          {store.slug}
                        </Badge>
                        {store.description && (
                          <Text size="xs" c="dimmed" lineClamp={2}>
                            {store.description}
                          </Text>
                        )}
                      </Stack>
                    </UnstyledButton>
                  );
                })}
              </SimpleGrid>
            </Stack>
          )}

          {b2cStores.length > 0 && (
            <Stack gap="sm">
              <Group gap="xs">
                <ShoppingBag size={18} />
                <Title order={5}>{t('b2c_section')}</Title>
              </Group>
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm">
                {b2cStores.map((store) => {
                  const isSelected = selectedId === store.id;
                  return (
                    <UnstyledButton
                      key={store.id}
                      onClick={() => setSelectedId(store.id)}
                      style={{
                        border: `2px solid ${
                          isSelected
                            ? 'var(--mantine-color-green-6)'
                            : 'var(--mantine-color-default-border)'
                        }`,
                        borderRadius: 'var(--mantine-radius-md)',
                        padding: 'var(--mantine-spacing-md)',
                        backgroundColor: isSelected
                          ? 'var(--mantine-color-green-light)'
                          : 'var(--mantine-color-body)',
                        transition: 'all 150ms ease',
                      }}
                    >
                      <Stack gap="xs">
                        <Group justify="space-between" align="flex-start">
                          <Text fw={600} size="sm" lineClamp={2}>
                            {store.name}
                          </Text>
                          {isSelected && (
                            <ThemeIcon
                              size={18}
                              variant="filled"
                              color="green"
                              radius="xl"
                            >
                              <Check size={12} />
                            </ThemeIcon>
                          )}
                        </Group>
                        <Badge size="xs" variant="light" color="green">
                          {store.slug}
                        </Badge>
                        {store.description && (
                          <Text size="xs" c="dimmed" lineClamp={2}>
                            {store.description}
                          </Text>
                        )}
                      </Stack>
                    </UnstyledButton>
                  );
                })}
              </SimpleGrid>
            </Stack>
          )}

          <Group justify="flex-end">
            <Button
              onClick={handleConfirm}
              disabled={!selectedId}
              rightSection={<Check size={14} />}
            >
              {t('confirm_button')}
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
