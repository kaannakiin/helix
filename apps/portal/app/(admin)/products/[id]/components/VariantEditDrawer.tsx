'use client';

import {
  Badge,
  Button,
  ColorSwatch,
  Divider,
  Drawer,
  Group,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
  type DrawerProps,
} from '@mantine/core';
import { getMimePatterns } from '@org/constants/product-constants';
import { FileType } from '@org/prisma/browser';
import type {
  ProductInputType,
  ProductVariantInputType,
} from '@org/schemas/admin/products';
import { Dropzone, type RemoteFile } from '@org/ui/dropzone';
import {
  generateEan13Barcode,
  generateSku,
} from '@org/utils/products/sku-barcode-generator';
import { useTranslations } from 'next-intl';
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Controller, useForm, useFormContext } from 'react-hook-form';
import type { OptionLookupEntry } from './VariantCombinationTable';

interface Props extends Omit<DrawerProps, 'title'> {
  variantIndex: number;
  optionLookup: Map<string, OptionLookupEntry>;
  trackingOptions: Array<{ value: string; label: string }>;
  deleteImage: (file: RemoteFile) => Promise<boolean>;
  deletingIds: Set<string>;
}

export const VariantEditDrawer = ({
  variantIndex,
  optionLookup,
  trackingOptions,
  deleteImage,
  deletingIds,
  ...drawerProps
}: Props) => {
  const t = useTranslations('frontend.admin.products.form');

  const { getValues: mainGetValues, setValue: mainSetValue } =
    useFormContext<ProductInputType>();

  const draftForm = useForm<ProductVariantInputType>({
    defaultValues: {
      uniqueId: '',
      uniqueKey: '',
      optionValueIds: [],
      sku: '',
      barcode: '',
      isActive: true,
      trackingStrategy: 'NONE',
      sortOrder: 0,
      newImages: [],
      existingImages: [],
    },
  });

  const {
    control: draftControl,
    getValues: draftGetValues,
    reset: draftReset,
    setValue: draftSetValue,
    watch,
  } = draftForm;

  const [variantExistingFiles, setVariantExistingFiles] = useState<
    RemoteFile[]
  >([]);

  const prevOpenedRef = useRef(false);

  useEffect(() => {
    if (drawerProps.opened && !prevOpenedRef.current) {
      const current = mainGetValues(`variants.${variantIndex}`);
      if (current) {
        draftReset(current as ProductVariantInputType);
        const existing: RemoteFile[] = (current.existingImages ?? []).map(
          (img, i) => ({
            id: img.id,
            url: img.url,
            fileType: img.fileType,
            order: img.sortOrder ?? i,
          })
        );
        setVariantExistingFiles(existing);
      }
    }
    prevOpenedRef.current = drawerProps.opened ?? false;
  }, [drawerProps.opened, variantIndex, mainGetValues, draftReset]);

  const handleRemoveExisting = useCallback(
    async (file: RemoteFile) => {
      const ok = await deleteImage(file);
      if (ok) {
        setVariantExistingFiles((prev) => prev.filter((f) => f.id !== file.id));
        draftSetValue(
          'existingImages',
          (draftGetValues('existingImages') ?? []).filter(
            (img) => img.id !== file.id
          ),
          { shouldDirty: true }
        );
      }
    },
    [deleteImage, draftSetValue, draftGetValues]
  );

  const handleReorderExisting = useCallback(
    (reordered: RemoteFile[]) => {
      setVariantExistingFiles(reordered);
      draftSetValue(
        'existingImages',
        reordered.map((f, i) => ({
          id: f.id,
          url: f.url,
          fileType: f.fileType,
          sortOrder: i,
        })),
        { shouldDirty: true }
      );
    },
    [draftSetValue]
  );

  const optionValueIds = watch('optionValueIds');

  const handleSave = () => {
    const draftValues = draftGetValues();
    const existingImages = variantExistingFiles.map((f, i) => ({
      id: f.id,
      url: f.url,
      fileType: f.fileType,
      sortOrder: i,
    }));
    mainSetValue(
      `variants.${variantIndex}`,
      { ...draftValues, existingImages } as any,
      { shouldDirty: true, shouldValidate: false }
    );
    drawerProps.onClose();
  };

  const handleCancel = () => {
    drawerProps.onClose();
  };

  const handleGenerateSku = () => {
    const productSlug = mainGetValues('translations.0.slug') || '';
    const currentOptionIds = draftGetValues('optionValueIds');
    const optionSlugs = currentOptionIds.map(
      (id) => optionLookup.get(id)?.slug ?? ''
    );
    const sku = generateSku({ productSlug, optionSlugs });
    draftSetValue('sku', sku, { shouldDirty: true });
  };

  const handleGenerateBarcode = () => {
    const barcode = generateEan13Barcode();
    draftSetValue('barcode', barcode, { shouldDirty: true });
  };

  return (
    <Drawer
      {...drawerProps}
      onClose={handleCancel}
      title={
        <Text fw={600} size="md">
          {t('combinations.editDrawer.title')}
        </Text>
      }
      position="bottom"
      size="xl"
    >
      <Stack gap="md">
        <div>
          <Text size="sm" fw={500} mb={4}>
            {t('combinations.editDrawer.variantInfo')}
          </Text>
          <Group gap={6}>
            {optionValueIds?.map((optId, i) => {
              const entry = optionLookup.get(optId);
              return (
                <Fragment key={optId}>
                  {i > 0 && (
                    <Text size="xs" c="dimmed">
                      /
                    </Text>
                  )}
                  {entry?.isColor && entry.colorCode ? (
                    <Group gap={4} wrap="nowrap">
                      <ColorSwatch color={entry.colorCode} size={14} />
                      <Text size="sm">{entry.name}</Text>
                    </Group>
                  ) : (
                    <Badge variant="light" size="sm">
                      {entry?.name ?? '—'}
                    </Badge>
                  )}
                </Fragment>
              );
            })}
          </Group>
        </div>

        <Divider />

        <Controller
          control={draftControl}
          name="sku"
          render={({ field, fieldState }) => (
            <TextInput
              {...field}
              value={field.value ?? ''}
              label={t('combinations.sku')}
              placeholder={t('combinations.skuPlaceholder')}
              error={fieldState.error?.message}
              rightSection={
                <Button
                  size="compact-xs"
                  variant="subtle"
                  onClick={handleGenerateSku}
                  px={6}
                >
                  {t('combinations.editDrawer.generateSku')}
                </Button>
              }
              rightSectionWidth={70}
            />
          )}
        />

        <Controller
          control={draftControl}
          name="barcode"
          render={({ field, fieldState }) => (
            <TextInput
              {...field}
              value={field.value ?? ''}
              label={t('combinations.barcode')}
              placeholder={t('combinations.barcodePlaceholder')}
              error={fieldState.error?.message}
              rightSection={
                <Button
                  size="compact-xs"
                  variant="subtle"
                  onClick={handleGenerateBarcode}
                  px={6}
                >
                  {t('combinations.editDrawer.generateBarcode')}
                </Button>
              }
              rightSectionWidth={70}
            />
          )}
        />

        <Controller
          control={draftControl}
          name="isActive"
          render={({ field }) => (
            <Switch
              label={t('combinations.isActive')}
              checked={field.value}
              onChange={(e) => field.onChange(e.currentTarget.checked)}
            />
          )}
        />

        <Controller
          control={draftControl}
          name="trackingStrategy"
          render={({ field, fieldState }) => (
            <Select
              {...field}
              label={t('combinations.trackingStrategy')}
              data={trackingOptions}
              allowDeselect={false}
              error={fieldState.error?.message}
            />
          )}
        />

        <Divider />

        <div>
          <Text size="sm" fw={500} mb={4}>
            {t('combinations.editDrawer.images')}
          </Text>
          <Text size="xs" c="dimmed" mb="sm">
            {t('combinations.editDrawer.imagesDescription')}
          </Text>
          <Controller
            control={draftControl}
            name="newImages"
            render={({ field }) => (
              <Dropzone
                value={field.value}
                onChange={field.onChange}
                existingFiles={variantExistingFiles}
                onRemoveExisting={handleRemoveExisting}
                onReorderExisting={handleReorderExisting}
                deletingIds={deletingIds}
                accept={getMimePatterns([FileType.IMAGE, FileType.VIDEO])}
                maxSize={5 * 1024 * 1024}
                maxFiles={10}
              />
            )}
          />
        </div>

        <Divider />

        <Group justify="flex-end">
          <Button variant="default" onClick={handleCancel}>
            {t('combinations.editDrawer.cancel')}
          </Button>
          <Button onClick={handleSave}>
            {t('combinations.editDrawer.save')}
          </Button>
        </Group>
      </Stack>
    </Drawer>
  );
};
