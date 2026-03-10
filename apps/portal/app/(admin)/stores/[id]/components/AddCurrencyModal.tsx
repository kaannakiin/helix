'use client';

import { useCreateStoreCurrency } from '@/core/hooks/useAdminStoreCurrencies';
import { Button, Group, Modal, Select, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { CurrencyCode } from '@org/prisma/browser';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

const ALL_CURRENCIES: CurrencyCode[] = Object.values(CurrencyCode).map(
  (val) => val
);

interface AddCurrencyModalProps {
  storeId: string;
  existingCodes: CurrencyCode[];
  opened: boolean;
  onClose: () => void;
}

export function AddCurrencyModal({
  storeId,
  existingCodes,
  opened,
  onClose,
}: AddCurrencyModalProps) {
  const t = useTranslations('frontend.admin.stores.currencies.addModal');
  const tCurrencies = useTranslations('frontend.admin.stores.currencies');
  const [selected, setSelected] = useState<CurrencyCode | null>(null);

  const createCurrency = useCreateStoreCurrency(storeId);

  const availableOptions = ALL_CURRENCIES.filter(
    (c) => !existingCodes.includes(c)
  ).map((c) => ({ value: c, label: c }));

  const handleAdd = async () => {
    if (!selected) return;
    try {
      await createCurrency.mutateAsync({
        currencyCode: selected,
        isSelectable: true,
        allowCheckout: false,
        sortOrder: 0,
      });
      notifications.show({
        color: 'green',
        message: tCurrencies('addSuccess'),
      });
      setSelected(null);
      onClose();
    } catch {
      notifications.show({ color: 'red', message: tCurrencies('addError') });
    }
  };

  const handleClose = () => {
    setSelected(null);
    onClose();
  };

  return (
    <Modal opened={opened} onClose={handleClose} title={t('title')}>
      {availableOptions.length === 0 ? (
        <Text size="sm" c="dimmed">
          {t('noneAvailable')}
        </Text>
      ) : (
        <Select
          label={t('currencyLabel')}
          placeholder={t('currencyPlaceholder')}
          data={availableOptions}
          value={selected}
          onChange={(v) => setSelected(v as CurrencyCode | null)}
        />
      )}
      <Group justify="flex-end" mt="md">
        <Button variant="default" onClick={handleClose}>
          {t('cancel')}
        </Button>
        {availableOptions.length > 0 && (
          <Button
            onClick={handleAdd}
            disabled={!selected}
            loading={createCurrency.isPending}
          >
            {t('add')}
          </Button>
        )}
      </Group>
    </Modal>
  );
}
