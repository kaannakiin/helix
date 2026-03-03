'use client';

import {
  Button,
  ColorInput,
  Divider,
  Drawer,
  Group,
  Stack,
  Text,
  TextInput,
  type DrawerProps,
} from '@mantine/core';
import { getMimePatterns } from '@org/constants/product-constants';
import { FileType, VariantGroupType } from '@org/prisma/browser';
import type { VariantGroupInput } from '@org/schemas/admin/variants';
import { Dropzone } from '@org/ui/dropzone';
import { useTranslations } from 'next-intl';
import { Controller, useWatch, type Control } from 'react-hook-form';

interface Props extends DrawerProps {
  optionIndex: number;
  onCommit: () => void;
  draftControl: Control<VariantGroupInput> | null;
}

export const VariantOptionDrawer = ({
  optionIndex,
  onCommit,
  draftControl,
  ...drawerProps
}: Props) => {
  const t = useTranslations('common.admin.products.form');

  const optionName = useWatch({
    control: draftControl ?? undefined,
    name: `options.${optionIndex}.translations.0.name`,
  });

  const groupType = useWatch({
    control: draftControl ?? undefined,
    name: 'type',
  });

  const isColor = groupType === VariantGroupType.COLOR;

  const handleSave = () => {
    drawerProps.onClose();
    onCommit();
  };

  const handleCancel = () => {
    drawerProps.onClose();
  };

  if (!draftControl) return null;

  return (
    <Drawer
      {...drawerProps}
      onClose={handleCancel}
      title={
        <Text fw={600}>{optionName || t('variants.optionDrawer.title')}</Text>
      }
      position="right"
      size="md"
    >
      <Stack gap="md">
        <Controller
          control={draftControl}
          name={`options.${optionIndex}.translations.0.name`}
          render={({ field, fieldState }) => (
            <TextInput
              {...field}
              label={t('variants.optionDrawer.name')}
              placeholder={t('variants.optionDrawer.namePlaceholder')}
              error={fieldState.error?.message}
            />
          )}
        />

        {isColor && (
          <>
            <Controller
              control={draftControl}
              name={`options.${optionIndex}.colorCode`}
              render={({ field, fieldState }) => (
                <ColorInput
                  label={t('variants.optionDrawer.colorCode')}
                  placeholder="#000000"
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                  format="hex"
                  swatches={[
                    '#ff0000',
                    '#ff8800',
                    '#ffff00',
                    '#00ff00',
                    '#0000ff',
                    '#8800ff',
                    '#ffffff',
                    '#000000',
                  ]}
                />
              )}
            />

            <Controller
              control={draftControl}
              name={`options.${optionIndex}.images`}
              render={({ field }) => (
                <Dropzone
                  value={field.value}
                  onChange={field.onChange}
                  accept={getMimePatterns([FileType.IMAGE])}
                  maxSize={5 * 1024 * 1024}
                  maxFiles={1}
                />
              )}
            />
          </>
        )}

        <Divider />

        <Group justify="flex-end">
          <Button variant="default" onClick={handleCancel}>
            {t('variants.cancel')}
          </Button>
          <Button onClick={handleSave}>{t('variants.save')}</Button>
        </Group>
      </Stack>
    </Drawer>
  );
};
