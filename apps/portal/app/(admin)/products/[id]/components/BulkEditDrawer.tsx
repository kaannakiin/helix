'use client';

import {
  Button,
  Divider,
  Drawer,
  Group,
  NumberInput,
  Select,
  Stack,
  Switch,
  Text,
  type DrawerProps,
} from '@mantine/core';
import { getMimePatterns } from '@org/constants/product-constants';
import { CurrencyCode, FileType } from '@org/prisma/browser';
import type { ProductInputType } from '@org/schemas/admin/products';
import type { DropzoneFile } from '@org/ui/dropzone';
import { Dropzone } from '@org/ui/dropzone';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';

interface Props extends Omit<DrawerProps, 'title'> {
  selectedIndices: Set<number>;
  trackingOptions: Array<{ value: string; label: string }>;
  currencyOptions: Array<{ value: string; label: string }>;
}

export const BulkEditDrawer = ({
  selectedIndices,
  trackingOptions,
  currencyOptions,
  ...drawerProps
}: Props) => {
  const t = useTranslations('frontend.admin.products.form');
  const { getValues, setValue } = useFormContext<ProductInputType>();

  const [isActive, setIsActive] = useState<boolean | null>(null);
  const [trackingStrategy, setTrackingStrategy] = useState<string | null>(null);
  const [bulkPrice, setBulkPrice] = useState<number | null>(null);
  const [bulkCostPrice, setBulkCostPrice] = useState<number | null>(null);
  const [bulkCostCurrencyCode, setBulkCostCurrencyCode] = useState<
    CurrencyCode | null
  >(null);
  const [bulkImages, setBulkImages] = useState<DropzoneFile[]>([]);

  const resetFields = () => {
    setIsActive(null);
    setTrackingStrategy(null);
    setBulkPrice(null);
    setBulkCostPrice(null);
    setBulkCostCurrencyCode(null);
    setBulkImages([]);
  };

  const hasChanges =
    isActive !== null ||
    trackingStrategy !== null ||
    bulkPrice !== null ||
    bulkCostPrice !== null ||
    bulkCostCurrencyCode !== null ||
    bulkImages.length > 0;

  const handleApply = () => {
    selectedIndices.forEach((index) => {
      if (isActive !== null) {
        setValue(`variants.${index}.isActive`, isActive, {
          shouldDirty: true,
        });
      }
      if (trackingStrategy !== null) {
        setValue(
          `variants.${index}.trackingStrategy`,
          trackingStrategy as any,
          { shouldDirty: true }
        );
      }
      if (bulkPrice !== null) {
        setValue(`variantPricing.${index}.price`, bulkPrice, {
          shouldDirty: true,
        });
      }
      if (bulkCostPrice !== null) {
        setValue(`variants.${index}.costPrice`, bulkCostPrice, {
          shouldDirty: true,
        });
      }
      if (bulkCostCurrencyCode !== null) {
        setValue(`variants.${index}.costCurrencyCode`, bulkCostCurrencyCode, {
          shouldDirty: true,
        });
      }
      if (bulkImages.length > 0) {
        const existing = getValues(`variants.${index}.newImages`) ?? [];
        const merged = [...existing, ...bulkImages].slice(0, 10);
        setValue(`variants.${index}.newImages`, merged as any, {
          shouldDirty: true,
        });
      }
    });
    resetFields();
    drawerProps.onClose();
  };

  const handleCancel = () => {
    resetFields();
    drawerProps.onClose();
  };

  return (
    <Drawer
      {...drawerProps}
      onClose={handleCancel}
      title={
        <Text fw={600} size="md">
          {t('combinations.bulkDrawer.title', {
            count: selectedIndices.size,
          })}
        </Text>
      }
      position="right"
      size="sm"
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          {t('combinations.bulkDrawer.description')}
        </Text>

        <Divider />

        <div>
          <Group justify="space-between" mb={4}>
            <Text size="sm" fw={500}>
              {t('combinations.isActive')}
            </Text>
            {isActive !== null && (
              <Button
                size="compact-xs"
                variant="subtle"
                color="gray"
                onClick={() => setIsActive(null)}
              >
                Reset
              </Button>
            )}
          </Group>
          <Switch
            checked={isActive ?? true}
            onChange={(e) => setIsActive(e.currentTarget.checked)}
            label={isActive === null ? '—' : isActive ? 'Active' : 'Inactive'}
            styles={isActive === null ? { track: { opacity: 0.4 } } : undefined}
          />
        </div>

        <div>
          <Group justify="space-between" mb={4}>
            <Text size="sm" fw={500}>
              {t('combinations.trackingStrategy')}
            </Text>
            {trackingStrategy !== null && (
              <Button
                size="compact-xs"
                variant="subtle"
                color="gray"
                onClick={() => setTrackingStrategy(null)}
              >
                Reset
              </Button>
            )}
          </Group>
          <Select
            data={trackingOptions}
            value={trackingStrategy}
            onChange={setTrackingStrategy}
            placeholder="—"
            allowDeselect={false}
            clearable
          />
        </div>

        <Divider />

        <div>
          <Group justify="space-between" mb={4}>
            <Text size="sm" fw={500}>
              {t('combinations.bulkDrawer.price')}
            </Text>
            {bulkPrice !== null && (
              <Button
                size="compact-xs"
                variant="subtle"
                color="gray"
                onClick={() => setBulkPrice(null)}
              >
                Reset
              </Button>
            )}
          </Group>
          <NumberInput
            value={bulkPrice ?? ''}
            onChange={(val) => setBulkPrice(val === '' ? null : Number(val))}
            placeholder={t('combinations.bulkDrawer.pricePlaceholder')}
            min={0}
            decimalScale={2}
            hideControls
          />
        </div>

        <div>
          <Group justify="space-between" mb={4}>
            <Text size="sm" fw={500}>
              {t('combinations.bulkDrawer.costPrice')}
            </Text>
            {bulkCostPrice !== null && (
              <Button
                size="compact-xs"
                variant="subtle"
                color="gray"
                onClick={() => setBulkCostPrice(null)}
              >
                Reset
              </Button>
            )}
          </Group>
          <NumberInput
            value={bulkCostPrice ?? ''}
            onChange={(val) =>
              setBulkCostPrice(val === '' ? null : Number(val))
            }
            placeholder={t('combinations.bulkDrawer.costPricePlaceholder')}
            min={0}
            decimalScale={2}
            hideControls
          />
        </div>

        <div>
          <Group justify="space-between" mb={4}>
            <Text size="sm" fw={500}>
              {t('combinations.bulkDrawer.costCurrency')}
            </Text>
            {bulkCostCurrencyCode !== null && (
              <Button
                size="compact-xs"
                variant="subtle"
                color="gray"
                onClick={() => setBulkCostCurrencyCode(null)}
              >
                Reset
              </Button>
            )}
          </Group>
          <Select
            data={currencyOptions}
            value={bulkCostCurrencyCode}
            onChange={(value) =>
              setBulkCostCurrencyCode((value as CurrencyCode | null) ?? null)
            }
            placeholder={t('combinations.bulkDrawer.costCurrencyPlaceholder')}
            clearable
          />
        </div>

        <Divider />

        <div>
          <Text size="sm" fw={500} mb={4}>
            {t('combinations.bulkDrawer.images')}
          </Text>
          <Text size="xs" c="dimmed" mb="sm">
            {t('combinations.bulkDrawer.imagesDescription')}
          </Text>
          <Dropzone
            value={bulkImages}
            onChange={setBulkImages}
            accept={getMimePatterns([FileType.IMAGE, FileType.VIDEO])}
            maxSize={5 * 1024 * 1024}
            maxFiles={10}
          />
        </div>

        <Divider />

        <Group justify="flex-end">
          <Button variant="default" onClick={handleCancel}>
            {t('combinations.bulkDrawer.cancel')}
          </Button>
          <Button onClick={handleApply} disabled={!hasChanges}>
            {t('combinations.bulkDrawer.apply')}
          </Button>
        </Group>
      </Stack>
    </Drawer>
  );
};
