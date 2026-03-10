'use client';

import {
  createVariantSearchFetcher,
  DATA_ACCESS_KEYS,
} from '@/core/hooks/useAdminLookup';
import { useBulkCreatePriceListPrices } from '@/core/hooks/useAdminPriceListPrices';
import {
  Button,
  Checkbox,
  Drawer,
  Group,
  Loader,
  ScrollArea,
  Select,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  buildEnumOptions,
  CurrencyCodeConfigs,
  PriceOriginTypeConfigs,
} from '@org/constants/enum-configs';
import type { PriceListPriceBulkCreateOutput } from '@org/schemas/admin/pricing';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo, useState } from 'react';

interface AddVariantsToPriceListDrawerProps {
  priceListId: string;
  defaultCurrencyCode: string;
  opened: boolean;
  onClose: () => void;
  onAdded: () => void;
}

export function AddVariantsToPriceListDrawer({
  priceListId,
  defaultCurrencyCode,
  opened,
  onClose,
  onAdded,
}: AddVariantsToPriceListDrawerProps) {
  const t = useTranslations('frontend.admin.priceLists.form.prices.addDrawer');
  const tEnums = useTranslations('frontend.enums');

  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchValue, 300);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currencyCode, setCurrencyCode] = useState(defaultCurrencyCode);
  const [originType, setOriginType] = useState<string>('FIXED');

  const bulkCreate = useBulkCreatePriceListPrices(priceListId);

  const currencyOptions = useMemo(
    () => buildEnumOptions(CurrencyCodeConfigs, tEnums),
    [tEnums]
  );
  const originTypeOptions = useMemo(
    () => buildEnumOptions(PriceOriginTypeConfigs, tEnums),
    [tEnums]
  );

  const fetcher = useMemo(
    () => createVariantSearchFetcher(priceListId),
    [priceListId]
  );

  const { data: variants, isLoading } = useQuery({
    queryKey: [
      ...DATA_ACCESS_KEYS.admin.priceLists.prices(priceListId),
      'search-variants',
      debouncedSearch,
    ],
    enabled: opened && debouncedSearch.length >= 1,
    queryFn: () => fetcher({ q: debouncedSearch, page: 1 }),
  });

  const toggleVariant = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleAdd = async () => {
    if (selectedIds.size === 0) return;
    try {
      await bulkCreate.mutateAsync({
        priceListId,
        variantIds: Array.from(selectedIds),
        currencyCode,
        unitOfMeasureId: '',
        originType,
      } as PriceListPriceBulkCreateOutput);
      notifications.show({ color: 'green', message: t('success') });
      setSelectedIds(new Set());
      setSearchValue('');
      onAdded();
      onClose();
    } catch {
      notifications.show({ color: 'red', message: t('error') });
    }
  };

  const handleClose = () => {
    setSelectedIds(new Set());
    setSearchValue('');
    onClose();
  };

  const variantList = Array.isArray(variants) ? variants : [];

  return (
    <Drawer.Root opened={opened} onClose={handleClose} position="right" size="lg">
      <Drawer.Overlay />
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>{t('title')}</Drawer.Title>
          <Group gap="xs" ml="auto">
            <Button variant="default" size="sm" onClick={handleClose}>
              {t('cancel')}
            </Button>
            <Button
              size="sm"
              onClick={handleAdd}
              loading={bulkCreate.isPending}
              disabled={selectedIds.size === 0}
            >
              {t('addSelected')} ({selectedIds.size})
            </Button>
          </Group>
        </Drawer.Header>

        <Drawer.Body>
          <Stack gap="md">
            <TextInput
              placeholder={t('searchPlaceholder')}
              leftSection={<Search size={16} />}
              value={searchValue}
              onChange={(e) => setSearchValue(e.currentTarget.value)}
            />

            <Group grow>
              <Select
                value={currencyCode}
                onChange={(val) => val && setCurrencyCode(val)}
                data={currencyOptions}
                label={t('currency')}
              />
              <Select
                value={originType}
                onChange={(val) => val && setOriginType(val)}
                data={originTypeOptions}
                label={t('originType')}
              />
            </Group>

            <ScrollArea h={400}>
              {isLoading ? (
                <Group justify="center" py="xl">
                  <Loader size="sm" />
                </Group>
              ) : variantList.length === 0 ? (
                <Text size="sm" c="dimmed" ta="center" py="xl">
                  {debouncedSearch.length >= 1
                    ? t('noResults')
                    : t('searchPlaceholder')}
                </Text>
              ) : (
                <Stack gap="xs">
                  {variantList.map((item) => (
                    <Checkbox
                      key={item.id}
                      label={item.label}
                      checked={selectedIds.has(item.id)}
                      onChange={() => toggleVariant(item.id)}
                    />
                  ))}
                </Stack>
              )}
            </ScrollArea>
          </Stack>
        </Drawer.Body>
      </Drawer.Content>
    </Drawer.Root>
  );
}
