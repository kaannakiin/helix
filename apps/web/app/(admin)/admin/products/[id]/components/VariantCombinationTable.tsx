'use client';

import {
  ActionIcon,
  Avatar,
  Badge,
  Button,
  Checkbox,
  ColorSwatch,
  Group,
  ScrollArea,
  Select,
  Switch,
  Table,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  TrackingStrategyConfigs,
  buildEnumOptions,
} from '@org/constants/enum-configs';
import { VariantGroupType } from '@org/prisma/browser';
import type { DropzoneFile } from '@org/ui/dropzone';
import type { ProductInputType } from '@org/schemas/admin/products';
import { FormCard } from '@org/ui/common/form-card';
import {
  generateEan13Barcode,
  generateSku,
} from '@org/utils/products/sku-barcode-generator';
import { ImagePlus, Pencil } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  Fragment,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Controller,
  useFieldArray,
  useFormContext,
  useWatch,
} from 'react-hook-form';
import { BulkEditDrawer } from './BulkEditDrawer';
import { VariantEditDrawer } from './VariantEditDrawer';

export interface OptionLookupEntry {
  name: string;
  slug: string;
  colorCode?: string;
  isColor: boolean;
  groupName: string;
}

export function buildOptionLookup(
  variantGroups: NonNullable<ProductInputType['variantGroups']>
): Map<string, OptionLookupEntry> {
  const map = new Map<string, OptionLookupEntry>();
  for (const group of variantGroups) {
    const groupName = group.translations?.[0]?.name ?? '';
    const isColor = group.type === VariantGroupType.COLOR;
    for (const opt of group.options ?? []) {
      map.set(opt.uniqueId, {
        name: opt.translations?.[0]?.name ?? '',
        slug: opt.translations?.[0]?.slug ?? '',
        colorCode: opt.colorCode ?? undefined,
        isColor,
        groupName,
      });
    }
  }
  return map;
}

interface VariantRowProps {
  index: number;
  optionLookup: Map<string, OptionLookupEntry>;
  trackingOptions: Array<{ value: string; label: string }>;
  isSelected: boolean;
  onToggleSelect: (index: number) => void;
  onEdit: (index: number) => void;
}

const VariantRow = memo(
  ({
    index,
    optionLookup,
    trackingOptions,
    isSelected,
    onToggleSelect,
    onEdit,
  }: VariantRowProps) => {
    const t = useTranslations('common.admin.products.form');
    const { control } = useFormContext<ProductInputType>();

    const optionValueIds = useWatch({
      control,
      name: `variants.${index}.optionValueIds`,
    });
    const newImages = useWatch({
      control,
      name: `variants.${index}.newImages`,
    });
    const existingImages = useWatch({
      control,
      name: `variants.${index}.existingImages`,
    });

    const firstNewImage = newImages?.[0];
    const firstExistingImage = existingImages?.[0];
    const thumbnailUrl = firstNewImage
      ? URL.createObjectURL(firstNewImage.file)
      : firstExistingImage?.url ?? null;
    const hasImages =
      (newImages?.length ?? 0) > 0 || (existingImages?.length ?? 0) > 0;

    return (
      <Table.Tr
        bg={isSelected ? 'var(--mantine-primary-color-light)' : undefined}
      >
        {/* Checkbox */}
        <Table.Td style={{ width: 40 }}>
          <Checkbox
            checked={isSelected}
            onChange={() => onToggleSelect(index)}
            size="xs"
          />
        </Table.Td>

        {/* Image thumbnail / + icon */}
        <Table.Td style={{ width: 48 }}>
          <Tooltip
            label={t('combinations.addImage')}
            disabled={hasImages}
            position="right"
          >
            <ActionIcon
              variant="subtle"
              size="sm"
              color={hasImages ? undefined : 'gray'}
              onClick={() => onEdit(index)}
            >
              {hasImages && thumbnailUrl ? (
                <Avatar src={thumbnailUrl} size={28} radius="sm" />
              ) : (
                <ImagePlus size={16} />
              )}
            </ActionIcon>
          </Tooltip>
        </Table.Td>

        {/* Variant options (consolidated) */}
        <Table.Td>
          <Group gap={6} wrap="nowrap">
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
        </Table.Td>

        {/* SKU — inline TextInput */}
        <Table.Td>
          <Controller
            control={control}
            name={`variants.${index}.sku`}
            render={({ field, fieldState }) => (
              <TextInput
                {...field}
                value={field.value ?? ''}
                size="xs"
                placeholder={t('combinations.skuPlaceholder')}
                error={!!fieldState.error}
                style={{ minWidth: 120 }}
              />
            )}
          />
        </Table.Td>

        {/* Barcode — inline TextInput */}
        <Table.Td>
          <Controller
            control={control}
            name={`variants.${index}.barcode`}
            render={({ field, fieldState }) => (
              <TextInput
                {...field}
                value={field.value ?? ''}
                size="xs"
                placeholder={t('combinations.barcodePlaceholder')}
                error={!!fieldState.error}
                style={{ minWidth: 120 }}
              />
            )}
          />
        </Table.Td>

        {/* isActive — inline Switch */}
        <Table.Td>
          <Controller
            control={control}
            name={`variants.${index}.isActive`}
            render={({ field }) => (
              <Switch
                checked={field.value}
                onChange={(e) => field.onChange(e.currentTarget.checked)}
                size="xs"
              />
            )}
          />
        </Table.Td>

        {/* Tracking Strategy — inline Select */}
        <Table.Td>
          <Controller
            control={control}
            name={`variants.${index}.trackingStrategy`}
            render={({ field, fieldState }) => (
              <Select
                {...field}
                data={trackingOptions}
                size="xs"
                allowDeselect={false}
                error={!!fieldState.error}
                style={{ minWidth: 130 }}
              />
            )}
          />
        </Table.Td>

        {/* Actions */}
        <Table.Td style={{ width: 50 }}>
          <ActionIcon variant="subtle" size="sm" onClick={() => onEdit(index)}>
            <Pencil size={14} />
          </ActionIcon>
        </Table.Td>
      </Table.Tr>
    );
  }
);

VariantRow.displayName = 'VariantRow';

export const VariantCombinationTable = () => {
  const t = useTranslations('common.admin.products.form');
  const tEnums = useTranslations('common.enums');
  const { control, getValues, setValue } = useFormContext<ProductInputType>();

  const { fields } = useFieldArray({
    control,
    name: 'variants',
    keyName: '_key',
  });

  const variantGroups = useWatch({ control, name: 'variantGroups' });
  const hasVariants = useWatch({ control, name: 'hasVariants' });

  const optionLookup = useMemo(
    () => buildOptionLookup(variantGroups ?? []),
    [variantGroups]
  );

  const trackingOptions = useMemo(
    () => buildEnumOptions(TrackingStrategyConfigs, tEnums),
    [tEnums]
  );

  // --- Selection state ---
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    new Set()
  );

  useEffect(() => {
    setSelectedIndices(new Set());
  }, [fields.length]);

  const toggleSelect = useCallback((index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIndices((prev) =>
      prev.size === fields.length ? new Set() : new Set(fields.map((_, i) => i))
    );
  }, [fields]);

  // --- Edit Drawer ---
  const [editDrawerOpened, editDrawerHandlers] = useDisclosure(false);
  const [editingVariantIndex, setEditingVariantIndex] = useState<number>(0);

  const handleEditVariant = useCallback(
    (index: number) => {
      setEditingVariantIndex(index);
      editDrawerHandlers.open();
    },
    [editDrawerHandlers]
  );

  // --- Bulk Edit Drawer ---
  const [bulkDrawerOpened, bulkDrawerHandlers] = useDisclosure(false);

  // --- Bulk Generate ---
  const handleBulkGenerateSku = useCallback(() => {
    const productSlug = getValues('translations.0.slug') || '';
    selectedIndices.forEach((index) => {
      const variant = getValues(`variants.${index}`);
      if (!variant) return;
      const optionSlugs = variant.optionValueIds.map(
        (id) => optionLookup.get(id)?.slug ?? ''
      );
      const sku = generateSku({ productSlug, optionSlugs });
      setValue(`variants.${index}.sku`, sku, { shouldDirty: true });
    });
  }, [selectedIndices, getValues, setValue, optionLookup]);

  const handleBulkGenerateBarcode = useCallback(() => {
    selectedIndices.forEach((index) => {
      const barcode = generateEan13Barcode();
      setValue(`variants.${index}.barcode`, barcode, { shouldDirty: true });
    });
  }, [selectedIndices, setValue]);

  if (!hasVariants || fields.length === 0) return null;

  const allSelected =
    selectedIndices.size === fields.length && fields.length > 0;
  const someSelected = selectedIndices.size > 0;

  return (
    <FormCard
      title={t('combinations.title')}
      description={t('combinations.description')}
    >
      {/* Bulk Action Toolbar */}
      {someSelected && (
        <Group
          justify="space-between"
          p="xs"
          mb="sm"
          style={{
            backgroundColor: 'var(--mantine-primary-color-light)',
            borderRadius: 'var(--mantine-radius-sm)',
          }}
        >
          <Text size="sm" fw={500}>
            {t('combinations.selectedCount', {
              count: selectedIndices.size,
            })}
          </Text>
          <Group gap="xs">
            <Button size="xs" variant="light" onClick={handleBulkGenerateSku}>
              {t('combinations.generateSku')}
            </Button>
            <Button
              size="xs"
              variant="light"
              onClick={handleBulkGenerateBarcode}
            >
              {t('combinations.generateBarcode')}
            </Button>
            <Button size="xs" variant="light" onClick={bulkDrawerHandlers.open}>
              {t('combinations.bulkEdit')}
            </Button>
            <Button
              size="xs"
              variant="subtle"
              color="gray"
              onClick={() => setSelectedIndices(new Set())}
            >
              {t('combinations.deselectAll')}
            </Button>
          </Group>
        </Group>
      )}

      <ScrollArea>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={{ width: 40 }}>
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected && !allSelected}
                  onChange={toggleSelectAll}
                  size="xs"
                />
              </Table.Th>
              <Table.Th style={{ width: 48 }} />
              <Table.Th>{t('combinations.variant')}</Table.Th>
              <Table.Th>{t('combinations.sku')}</Table.Th>
              <Table.Th>{t('combinations.barcode')}</Table.Th>
              <Table.Th>{t('combinations.isActive')}</Table.Th>
              <Table.Th>{t('combinations.trackingStrategy')}</Table.Th>
              <Table.Th style={{ width: 50 }}>
                {t('combinations.actions')}
              </Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {fields.map((field, index) => (
              <VariantRow
                key={field._key}
                index={index}
                optionLookup={optionLookup}
                trackingOptions={trackingOptions}
                isSelected={selectedIndices.has(index)}
                onToggleSelect={toggleSelect}
                onEdit={handleEditVariant}
              />
            ))}
          </Table.Tbody>
        </Table>
      </ScrollArea>

      <Text size="xs" c="dimmed" mt="xs">
        {t('combinations.count', { count: fields.length })}
      </Text>

      {/* Edit Drawer */}
      <VariantEditDrawer
        opened={editDrawerOpened}
        onClose={editDrawerHandlers.close}
        variantIndex={editingVariantIndex}
        optionLookup={optionLookup}
        trackingOptions={trackingOptions}
      />

      {/* Bulk Edit Drawer */}
      <BulkEditDrawer
        opened={bulkDrawerOpened}
        onClose={bulkDrawerHandlers.close}
        selectedIndices={selectedIndices}
        trackingOptions={trackingOptions}
      />
    </FormCard>
  );
};
