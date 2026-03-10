'use client';

import { useSavePriceListPrice } from '@/core/hooks/useAdminPriceListPrices';
import {
  Alert,
  Button,
  Collapse,
  Drawer,
  Group,
  NumberInput,
  Select,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  AdjustmentTypeConfigs,
  CurrencyCodeConfigs,
  PriceOriginTypeConfigs,
  TaxBehaviorConfigs,
  buildEnumOptions,
} from '@org/constants/enum-configs';
import { useTranslatedZodResolver } from '@org/hooks/useTranslatedZodResolver';
import {
  PriceListPriceSaveSchema,
  type PriceListPriceSaveInput,
  type PriceListPriceSaveOutput,
} from '@org/schemas/admin/pricing';
import type { AdminPriceListPriceListPrismaType } from '@org/types/admin/pricing';
import { DateTimeRangeField } from '@org/ui/inputs/date-time-range';
import { ChevronDown, Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { Controller, FormProvider, useForm } from 'react-hook-form';

interface EditPriceRowDrawerProps {
  priceListId: string;
  priceRow: AdminPriceListPriceListPrismaType | null;
  onClose: () => void;
  onSaved: () => void;
}

export function EditPriceRowDrawer({
  priceListId,
  priceRow,
  onClose,
  onSaved,
}: EditPriceRowDrawerProps) {
  const t = useTranslations('frontend.admin.priceLists.form.prices.editDrawer');
  const tEnums = useTranslations('frontend.enums');
  const [metadataOpen, setMetadataOpen] = useState(false);

  const saveMutation = useSavePriceListPrice(priceListId);
  const resolver = useTranslatedZodResolver(PriceListPriceSaveSchema);

  const currencyOptions = useMemo(
    () => buildEnumOptions(CurrencyCodeConfigs, tEnums),
    [tEnums]
  );
  const originTypeOptions = useMemo(
    () => buildEnumOptions(PriceOriginTypeConfigs, tEnums),
    [tEnums]
  );
  const adjustmentTypeOptions = useMemo(
    () => buildEnumOptions(AdjustmentTypeConfigs, tEnums),
    [tEnums]
  );
  const taxBehaviorOptions = useMemo(
    () => buildEnumOptions(TaxBehaviorConfigs, tEnums),
    [tEnums]
  );

  const formValues = useMemo(() => {
    if (!priceRow) return undefined;
    return {
      id: priceRow.id,
      priceListId,
      productVariantId: priceRow.productVariantId,
      originType: priceRow.originType as 'FIXED' | 'RELATIVE',
      price: priceRow.price ? Number(priceRow.price) : null,
      compareAtPrice: priceRow.compareAtPrice
        ? Number(priceRow.compareAtPrice)
        : null,
      costPrice: priceRow.costPrice ? Number(priceRow.costPrice) : null,
      adjustmentType: (priceRow.adjustmentType as 'PERCENTAGE' | 'FIXED_AMOUNT' | null) ?? null,
      adjustmentValue: priceRow.adjustmentValue
        ? Number(priceRow.adjustmentValue)
        : null,
      currencyCode: priceRow.currencyCode as 'TRY' | 'USD' | 'EUR' | 'GBP',
      minQuantity: priceRow.minQuantity != null ? Number(priceRow.minQuantity) : 1,
      maxQuantity: priceRow.maxQuantity != null ? Number(priceRow.maxQuantity) : null,
      unitOfMeasureId: priceRow.unitOfMeasureId,
      taxBehavior: (priceRow.taxBehavior as 'INCLUSIVE' | 'EXCLUSIVE' | 'UNSPECIFIED') ?? 'INCLUSIVE',
      validFrom: priceRow.validFrom
        ? new Date(priceRow.validFrom).toISOString()
        : null,
      validTo: priceRow.validTo
        ? new Date(priceRow.validTo).toISOString()
        : null,
      conditionType: priceRow.conditionType ?? null,
    };
  }, [priceRow, priceListId]);

  const methods = useForm<PriceListPriceSaveInput>({
    resolver,
    values: formValues as PriceListPriceSaveInput | undefined,
  });

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { isSubmitting },
  } = methods;

  const watchOriginType = watch('originType');
  const isLocked = priceRow?.isSourceLocked ?? false;

  useEffect(() => {
    if (!priceRow) {
      reset();
      setMetadataOpen(false);
    }
  }, [priceRow, reset]);

  const variantName =
    priceRow?.productVariant?.product?.translations?.[0]?.name ?? '—';
  const variantSku = priceRow?.productVariant?.sku ?? '—';

  const onSubmit = async (data: PriceListPriceSaveInput) => {
    try {
      await saveMutation.mutateAsync(data as PriceListPriceSaveOutput);
      notifications.show({ color: 'green', message: t('saveSuccess') });
      onSaved();
      onClose();
    } catch {
      notifications.show({ color: 'red', message: t('saveError') });
    }
  };

  return (
    <Drawer
      opened={!!priceRow}
      onClose={onClose}
      title={t('title')}
      position="right"
      size="lg"
    >
      {priceRow && (
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Stack gap="md">
              {isLocked && (
                <Alert
                  color="orange"
                  variant="light"
                  icon={<Lock size={16} />}
                >
                  {t('lockedWarning')}
                </Alert>
              )}

              <TextInput label={t('variant')} value={variantName} readOnly />
              <TextInput label={t('sku')} value={variantSku} readOnly />

              <Controller
                name="currencyCode"
                control={control}
                render={({ field, fieldState }) => (
                  <Select
                    value={field.value}
                    onChange={(val) => field.onChange(val)}
                    data={currencyOptions}
                    label={t('currency')}
                    error={fieldState.error?.message}
                    disabled={isLocked}
                    required
                  />
                )}
              />

              <Controller
                name="originType"
                control={control}
                render={({ field, fieldState }) => (
                  <Select
                    value={field.value}
                    onChange={(val) => field.onChange(val)}
                    data={originTypeOptions}
                    label={t('originType')}
                    error={fieldState.error?.message}
                    disabled={isLocked}
                    required
                  />
                )}
              />

              {watchOriginType === 'FIXED' && (
                <Controller
                  name="price"
                  control={control}
                  render={({ field, fieldState }) => (
                    <NumberInput
                      value={field.value ?? ''}
                      onChange={(val) =>
                        field.onChange(val === '' ? null : Number(val))
                      }
                      label={t('price')}
                      error={fieldState.error?.message}
                      disabled={isLocked}
                      min={0}
                      decimalScale={4}
                      required
                    />
                  )}
                />
              )}

              {watchOriginType === 'RELATIVE' && (
                <>
                  <Controller
                    name="adjustmentType"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Select
                        value={field.value ?? null}
                        onChange={(val) => field.onChange(val)}
                        data={adjustmentTypeOptions}
                        label={t('adjustmentType')}
                        error={fieldState.error?.message}
                        disabled={isLocked}
                        required
                      />
                    )}
                  />
                  <Controller
                    name="adjustmentValue"
                    control={control}
                    render={({ field, fieldState }) => (
                      <NumberInput
                        value={field.value ?? ''}
                        onChange={(val) =>
                          field.onChange(val === '' ? null : Number(val))
                        }
                        label={t('adjustmentValue')}
                        error={fieldState.error?.message}
                        disabled={isLocked}
                        decimalScale={4}
                        required
                      />
                    )}
                  />
                </>
              )}

              <Controller
                name="compareAtPrice"
                control={control}
                render={({ field, fieldState }) => (
                  <NumberInput
                    value={field.value ?? ''}
                    onChange={(val) =>
                      field.onChange(val === '' ? null : Number(val))
                    }
                    label={t('compareAtPrice')}
                    error={fieldState.error?.message}
                    disabled={isLocked}
                    min={0}
                    decimalScale={4}
                  />
                )}
              />

              <Controller
                name="costPrice"
                control={control}
                render={({ field, fieldState }) => (
                  <NumberInput
                    value={field.value ?? ''}
                    onChange={(val) =>
                      field.onChange(val === '' ? null : Number(val))
                    }
                    label={t('costPrice')}
                    error={fieldState.error?.message}
                    disabled={isLocked}
                    min={0}
                    decimalScale={4}
                  />
                )}
              />

              <Group grow>
                <Controller
                  name="minQuantity"
                  control={control}
                  render={({ field, fieldState }) => (
                    <NumberInput
                      value={field.value}
                      onChange={(val) => field.onChange(Number(val))}
                      label={t('minQuantity')}
                      error={fieldState.error?.message}
                      disabled={isLocked}
                      min={0}
                    />
                  )}
                />
                <Controller
                  name="maxQuantity"
                  control={control}
                  render={({ field, fieldState }) => (
                    <NumberInput
                      value={field.value ?? ''}
                      onChange={(val) =>
                        field.onChange(val === '' ? null : Number(val))
                      }
                      label={t('maxQuantity')}
                      error={fieldState.error?.message}
                      disabled={isLocked}
                      min={0}
                    />
                  )}
                />
              </Group>

              <Controller
                name="taxBehavior"
                control={control}
                render={({ field, fieldState }) => (
                  <Select
                    value={field.value}
                    onChange={(val) => field.onChange(val)}
                    data={taxBehaviorOptions}
                    label={t('taxBehavior')}
                    error={fieldState.error?.message}
                    disabled={isLocked}
                  />
                )}
              />

              <DateTimeRangeField<PriceListPriceSaveInput>
                startName="validFrom"
                endName="validTo"
                startLabel={t('validFrom')}
                endLabel={t('validTo')}
                mode="both"
              />

              <Button
                variant="subtle"
                size="xs"
                rightSection={
                  <ChevronDown
                    size={14}
                    style={{
                      transform: metadataOpen
                        ? 'rotate(180deg)'
                        : 'rotate(0deg)',
                      transition: 'transform 200ms',
                    }}
                  />
                }
                onClick={() => setMetadataOpen((v) => !v)}
              >
                {t('metadata')}
              </Button>
              <Collapse in={metadataOpen}>
                <Stack gap="xs" p="xs">
                  <Text size="xs" c="dimmed">
                    {t('sourcePrice')}:{' '}
                    {priceRow?.sourcePrice != null
                      ? String(priceRow.sourcePrice)
                      : '—'}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {t('sourceExchangeRate')}:{' '}
                    {priceRow?.sourceAppliedExchangeRate != null
                      ? String(priceRow.sourceAppliedExchangeRate)
                      : '—'}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {t('lastRateComputedAt')}:{' '}
                    {priceRow?.lastRateComputedAt
                      ? new Date(priceRow.lastRateComputedAt).toLocaleString()
                      : '—'}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {t('isSourceLocked')}:{' '}
                    {priceRow?.isSourceLocked ? 'Yes' : 'No'}
                  </Text>
                </Stack>
              </Collapse>

              <Group justify="flex-end" mt="md">
                <Button variant="default" onClick={onClose}>
                  {t('cancel')}
                </Button>
                <Button
                  type="submit"
                  loading={isSubmitting}
                  disabled={isLocked}
                >
                  {t('save')}
                </Button>
              </Group>
            </Stack>
          </form>
        </FormProvider>
      )}
    </Drawer>
  );
}
