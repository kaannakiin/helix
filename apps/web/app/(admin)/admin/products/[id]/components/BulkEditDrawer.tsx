'use client';

import {
  Button,
  Divider,
  Drawer,
  Group,
  Select,
  Stack,
  Switch,
  Text,
  type DrawerProps,
} from '@mantine/core';
import { getMimePatterns } from '@org/constants/product-constants';
import { FileType } from '@org/prisma/browser';
import type { ProductInputType } from '@org/schemas/admin/products';
import { Dropzone } from '@org/ui/dropzone';
import type { DropzoneFile } from '@org/ui/dropzone';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';

interface Props extends Omit<DrawerProps, 'title'> {
  selectedIndices: Set<number>;
  trackingOptions: Array<{ value: string; label: string }>;
}

export const BulkEditDrawer = ({
  selectedIndices,
  trackingOptions,
  ...drawerProps
}: Props) => {
  const t = useTranslations('common.admin.products.form');
  const { getValues, setValue } = useFormContext<ProductInputType>();

  const [isActive, setIsActive] = useState<boolean | null>(null);
  const [trackingStrategy, setTrackingStrategy] = useState<string | null>(
    null,
  );
  const [bulkImages, setBulkImages] = useState<DropzoneFile[]>([]);

  const resetFields = () => {
    setIsActive(null);
    setTrackingStrategy(null);
    setBulkImages([]);
  };

  const hasChanges =
    isActive !== null || trackingStrategy !== null || bulkImages.length > 0;

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
          { shouldDirty: true },
        );
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

        {/* isActive */}
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
            label={
              isActive === null ? '—' : isActive ? 'Active' : 'Inactive'
            }
            styles={
              isActive === null ? { track: { opacity: 0.4 } } : undefined
            }
          />
        </div>

        {/* Tracking Strategy */}
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

        {/* Bulk Images */}
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

        {/* Footer */}
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
