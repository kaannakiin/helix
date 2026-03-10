'use client';

import {
  useAdminStoreCurrencies,
  useDeleteStoreCurrency,
  useUpdateStoreCurrency,
} from '@/core/hooks/useAdminStoreCurrencies';
import { useUpdateStore } from '@/core/hooks/useAdminStores';
import type { Store, StoreCurrency } from '@org/prisma/browser';
import type { CurrencyCode } from '@org/prisma/browser';
import {
  ActionIcon,
  Badge,
  Button,
  Group,
  NumberInput,
  Select,
  Skeleton,
  Stack,
  Switch,
  Table,
  Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { FormCard } from '@org/ui/common/form-card';
import { Coins, Trash } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { AddCurrencyModal } from './AddCurrencyModal';

const CURRENCY_OPTIONS: CurrencyCode[] = ['TRY', 'USD', 'EUR', 'GBP'];

function deriveRole(
  row: StoreCurrency,
  defaultCurrencyCode: CurrencyCode,
  t: (key: string) => string
): string {
  if (row.currencyCode === defaultCurrencyCode) return t('roles.default');
  if (row.allowCheckout) return t('roles.checkout');
  return t('roles.displayOnly');
}

function roleBadgeColor(
  row: StoreCurrency,
  defaultCurrencyCode: CurrencyCode
): string {
  if (row.currencyCode === defaultCurrencyCode) return 'blue';
  if (row.allowCheckout) return 'teal';
  return 'gray';
}

interface StoreCurrencyPolicyCardProps {
  storeId: string;
  store: Store | undefined;
}

export function StoreCurrencyPolicyCard({
  storeId,
  store,
}: StoreCurrencyPolicyCardProps) {
  const t = useTranslations('frontend.admin.stores.currencies');
  const tForm = useTranslations('frontend.admin.stores.form');

  const { data: currencies, isLoading } = useAdminStoreCurrencies(storeId);
  const updateCurrency = useUpdateStoreCurrency(storeId);
  const deleteCurrency = useDeleteStoreCurrency(storeId);
  const updateStore = useUpdateStore({ storeId });

  const [addOpened, { open: openAdd, close: closeAdd }] = useDisclosure(false);
  const [sortValues, setSortValues] = useState<Record<string, number>>({});

  const defaultCurrencyCode = store?.defaultCurrencyCode as
    | CurrencyCode
    | undefined;
  const existingCodes = (currencies ?? []).map(
    (c) => c.currencyCode as CurrencyCode
  );

  const handleDefaultCurrencyChange = (newCode: string | null) => {
    if (!newCode || newCode === defaultCurrencyCode) return;
    modals.openConfirmModal({
      title: t('defaultCurrency.changeConfirmTitle'),
      children: (
        <Text size="sm">{t('defaultCurrency.changeConfirmBody')}</Text>
      ),
      labels: {
        confirm: t('defaultCurrency.changeConfirmBtn'),
        cancel: t('defaultCurrency.cancel'),
      },
      onConfirm: () => {
        updateStore.mutate(
          { currency: newCode as CurrencyCode },
          {
            onSuccess: () =>
              notifications.show({
                color: 'green',
                message: t('saveSuccess'),
              }),
            onError: () =>
              notifications.show({ color: 'red', message: t('saveError') }),
          }
        );
      },
    });
  };

  const handleToggle = (
    row: StoreCurrency,
    field: 'isSelectable' | 'allowCheckout',
    value: boolean
  ) => {
    updateCurrency.mutate(
      { id: row.id, data: { [field]: value } },
      {
        onError: () =>
          notifications.show({ color: 'red', message: t('saveError') }),
      }
    );
  };

  const handleSortBlur = (row: StoreCurrency) => {
    const val = sortValues[row.id];
    if (val === undefined || val === row.sortOrder) return;
    updateCurrency.mutate(
      { id: row.id, data: { sortOrder: val } },
      {
        onError: () =>
          notifications.show({ color: 'red', message: t('saveError') }),
      }
    );
  };

  const handleDelete = (row: StoreCurrency) => {
    modals.openConfirmModal({
      title: t('deleteSuccess'),
      children: <Text size="sm">{t('deleteSuccess')}</Text>,
      labels: { confirm: t('deleteSuccess'), cancel: tForm('discard') },
      confirmProps: { color: 'red' },
      onConfirm: () =>
        deleteCurrency.mutate(row.id, {
          onSuccess: () =>
            notifications.show({ color: 'green', message: t('deleteSuccess') }),
          onError: () =>
            notifications.show({ color: 'red', message: t('deleteError') }),
        }),
    });
  };

  return (
    <Stack gap="md">
      <FormCard
        title={t('defaultCurrency.title')}
        description={t('defaultCurrency.description')}
        icon={Coins}
        iconColor="violet"
      >
        <Select
          label={t('defaultCurrency.label')}
          data={CURRENCY_OPTIONS.map((c) => ({ value: c, label: c }))}
          value={defaultCurrencyCode ?? null}
          onChange={handleDefaultCurrencyChange}
          w={200}
        />
      </FormCard>

      <FormCard
        title={t('policy.title')}
        description={t('policy.description')}
        icon={Coins}
        iconColor="teal"
        rightSection={
          <Button size="xs" variant="default" onClick={openAdd}>
            {t('policy.addCurrency')}
          </Button>
        }
      >
        {isLoading ? (
          <Stack gap="xs">
            <Skeleton height={36} />
            <Skeleton height={36} />
          </Stack>
        ) : (
          <Table horizontalSpacing="sm" verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('policy.colCurrency')}</Table.Th>
                <Table.Th>{t('policy.colStorefront')}</Table.Th>
                <Table.Th>{t('policy.colCheckout')}</Table.Th>
                <Table.Th>{t('policy.colSortOrder')}</Table.Th>
                <Table.Th>{t('policy.colRole')}</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(currencies ?? []).map((row) => {
                const isDefault = row.currencyCode === defaultCurrencyCode;
                const sortVal =
                  sortValues[row.id] !== undefined
                    ? sortValues[row.id]
                    : row.sortOrder;
                return (
                  <Table.Tr key={row.id}>
                    <Table.Td>
                      <Badge variant="light" color="blue">
                        {row.currencyCode}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Switch
                        checked={row.isSelectable}
                        onChange={(e) =>
                          handleToggle(row, 'isSelectable', e.currentTarget.checked)
                        }
                      />
                    </Table.Td>
                    <Table.Td>
                      <Switch
                        checked={row.allowCheckout}
                        disabled={isDefault}
                        onChange={(e) =>
                          handleToggle(row, 'allowCheckout', e.currentTarget.checked)
                        }
                      />
                    </Table.Td>
                    <Table.Td>
                      <NumberInput
                        value={sortVal}
                        min={0}
                        w={80}
                        onChange={(v) =>
                          setSortValues((prev) => ({
                            ...prev,
                            [row.id]: Number(v),
                          }))
                        }
                        onBlur={() => handleSortBlur(row)}
                      />
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        variant="light"
                        color={roleBadgeColor(
                          row,
                          defaultCurrencyCode as CurrencyCode
                        )}
                      >
                        {deriveRole(row, defaultCurrencyCode as CurrencyCode, t)}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      {!isDefault && (
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          onClick={() => handleDelete(row)}
                        >
                          <Trash size={16} />
                        </ActionIcon>
                      )}
                    </Table.Td>
                  </Table.Tr>
                );
              })}
              {(currencies ?? []).length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={6}>
                    <Text size="sm" c="dimmed" ta="center">
                      {t('addModal.noneAvailable')}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        )}
      </FormCard>

      <AddCurrencyModal
        storeId={storeId}
        existingCodes={existingCodes}
        opened={addOpened}
        onClose={closeAdd}
      />
    </Stack>
  );
}
