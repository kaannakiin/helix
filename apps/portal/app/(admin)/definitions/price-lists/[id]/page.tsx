'use client';

import {
  useAdminPriceList,
  useSavePriceList,
} from '@/core/hooks/useAdminPriceLists';
import { useAdminStores } from '@/core/hooks/useAdminStores';
import { ApiError } from '@/core/lib/api/api-error';
import {
  Alert,
  Button,
  Divider,
  Group,
  NumberInput,
  Select,
  Stack,
  Switch,
  Tabs,
  Text,
  TextInput,
  Textarea,
} from '@mantine/core';
import { DateTimeRangeField } from '@org/ui/inputs/date-time-range';
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  CurrencyCodeConfigs,
  PriceListStatusConfigs,
  PriceListTypeConfigs,
  RoundingRuleConfigs,
  SourceSystemConfigs,
  buildEnumOptions,
} from '@org/constants/enum-configs';
import { useTranslatedZodResolver } from '@org/hooks/useTranslatedZodResolver';
import {
  NEW_PRICE_LIST_DEFAULT_VALUES,
  PriceListSchema,
  type PriceListInput,
  type PriceListOutput,
} from '@org/schemas/admin/pricing';
import { FormCard } from '@org/ui/common/form-card';
import LoadingOverlay from '@org/ui/common/loading-overlay';
import { createId } from '@paralleldrive/cuid2';
import {
  Activity,
  ArrowLeftRight,
  Calendar,
  FileText,
  Info,
  Lock,
  Save,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { PriceListAssignmentsTab } from './components/PriceListAssignmentsTab';
import { PriceListPricesTab } from './components/PriceListPricesTab';
import {
  Controller,
  FormProvider,
  useForm,
  type SubmitHandler,
} from 'react-hook-form';

const AdminPriceListFormPage = () => {
  const t = useTranslations('frontend.admin.priceLists.form');
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const isNew = id === 'new';

  const { data, isLoading, isError, error } = useAdminPriceList(id);
  const apiError = error as ApiError | null;
  const { data: stores } = useAdminStores();

  const savePriceList = useSavePriceList({
    onSuccess: () =>
      notifications.show({ color: 'green', message: t('saveSuccess') }),
    onError: (err) =>
      notifications.show({
        color: 'red',
        title: t('loadError'),
        message: err?.message ?? t('saveError'),
      }),
  });

  const isMobile = useMediaQuery('(max-width: 768px)');

  const storeOptions = useMemo(
    () =>
      (stores ?? []).map((s) => ({
        value: s.id,
        label: s.name,
      })),
    [stores]
  );

  const formattedData = useMemo<PriceListInput>(() => {
    if (!data || isNew) {
      return { ...NEW_PRICE_LIST_DEFAULT_VALUES, uniqueId: createId() };
    }

    return {
      uniqueId: data.id,
      name: data.name,
      storeId: data.storeId,
      type: data.type,
      status: data.status,
      defaultCurrencyCode: data.defaultCurrencyCode,
      parentPriceListId: data.parentPriceListId ?? null,
      adjustmentType: data.adjustmentType ?? null,
      adjustmentValue: data.adjustmentValue
        ? Number(data.adjustmentValue)
        : null,
      validFrom: data.validFrom ? new Date(data.validFrom).toISOString() : null,
      validTo: data.validTo ? new Date(data.validTo).toISOString() : null,
      priority: data.priority,
      description: data.description ?? null,
      isActive: data.isActive,
      prices: [],
      contractRef: data.contractRef ?? undefined,
      sourceSystem: data.sourceSystem,
      isSourceLocked: data.isSourceLocked,
      isExchangeRateDerived: data.isExchangeRateDerived,
      sourceCurrencyCode: data.sourceCurrencyCode ?? null,
      roundingRule: data.roundingRule,
    };
  }, [data, isNew]);

  const resolver = useTranslatedZodResolver(PriceListSchema);
  const methods = useForm<PriceListInput>({
    resolver,
    defaultValues: { ...NEW_PRICE_LIST_DEFAULT_VALUES, uniqueId: createId() },
    values: formattedData,
  });

  const {
    control,
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = methods;

  const watchType = watch('type');
  const watchIsExchangeRateDerived = watch('isExchangeRateDerived');
  const watchIsSourceLocked = watch('isSourceLocked');
  const watchSourceSystem = watch('sourceSystem');
  const watchSourceCurrencyCode = watch('sourceCurrencyCode');
  const watchDefaultCurrencyCode = watch('defaultCurrencyCode');
  const watchName = watch('name');

  const tEnums = useTranslations('frontend.enums');
  const typeOptions = useMemo(
    () => buildEnumOptions(PriceListTypeConfigs, tEnums),
    [tEnums]
  );
  const statusOptions = useMemo(
    () => buildEnumOptions(PriceListStatusConfigs, tEnums),
    [tEnums]
  );
  const currencyOptions = useMemo(
    () => buildEnumOptions(CurrencyCodeConfigs, tEnums),
    [tEnums]
  );
  const sourceSystemOptions = useMemo(
    () => buildEnumOptions(SourceSystemConfigs, tEnums),
    [tEnums]
  );
  const roundingRuleOptions = useMemo(
    () => buildEnumOptions(RoundingRuleConfigs, tEnums),
    [tEnums]
  );

  const onSubmit: SubmitHandler<PriceListInput> = async (formData) => {
    try {
      await savePriceList.mutateAsync(formData as unknown as PriceListOutput);
      router.push('/definitions/price-lists');
    } catch {}
  };

  if (isLoading && !isNew) return <LoadingOverlay />;

  if (!isNew && isError) {
    return (
      <Stack p="md" gap="md">
        <Alert
          color="red"
          title={apiError?.isNotFound ? t('notFound') : t('loadError')}
        >
          {apiError?.isNotFound
            ? t('notFoundDescription')
            : t('loadErrorDescription')}
        </Alert>
        <Button
          variant="default"
          onClick={() => router.push('/definitions/price-lists')}
        >
          {t('backToList')}
        </Button>
      </Stack>
    );
  }

  return (
    <FormProvider {...methods}>
      <div>
        <Stack gap="lg">
          <div>
            <Group justify="space-between" align="center">
              <Text size="xl" fw={700} lh={1.2}>
                {watchName || (isNew ? t('newPriceList') : '—')}
              </Text>
              <Group gap="sm">
                <Button
                  variant="default"
                  onClick={() => router.push('/definitions/price-lists')}
                >
                  {t('discard')}
                </Button>
                <Button
                  type="button"
                  leftSection={<Save size={16} />}
                  loading={isSubmitting}
                  onClick={handleSubmit(onSubmit)}
                >
                  {t('save')}
                </Button>
              </Group>
            </Group>
          </div>

          <Tabs defaultValue="general">
            <Tabs.List>
              <Tabs.Tab value="general">{t('tabs.general')}</Tabs.Tab>
              <Tabs.Tab value="assignments" disabled={isNew}>
                {t('tabs.assignments')}
              </Tabs.Tab>
              <Tabs.Tab value="prices" disabled={isNew}>
                {t('tabs.prices')}
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="general" pt="lg">
              <Group align="flex-start" gap="lg" wrap="wrap">
                <Stack
                  gap="md"
                  style={{ flex: 1, minWidth: isMobile ? '100%' : 400 }}
                >
                  <FormCard
                    title={t('generalInfo')}
                    icon={FileText}
                    iconColor="blue"
                  >
                    <Stack gap="md">
                      <Controller
                        control={control}
                        name="name"
                        render={({ field, fieldState }) => (
                          <TextInput
                            {...field}
                            label={t('name.label')}
                            placeholder={t('name.placeholder')}
                            error={fieldState.error?.message}
                            required
                          />
                        )}
                      />
                      <Controller
                        control={control}
                        name="storeId"
                        render={({ field, fieldState }) => (
                          <Select
                            value={field.value || null}
                            onChange={(val) => field.onChange(val ?? '')}
                            data={storeOptions}
                            label={t('store.label')}
                            placeholder={t('store.placeholder')}
                            error={fieldState.error?.message}
                            required
                            disabled={!isNew}
                            searchable
                          />
                        )}
                      />
                      <Controller
                        control={control}
                        name="type"
                        render={({ field, fieldState }) => (
                          <Select
                            value={field.value}
                            onChange={(val) => field.onChange(val)}
                            data={typeOptions}
                            label={t('type.label')}
                            error={fieldState.error?.message}
                            required
                          />
                        )}
                      />
                      <Controller
                        control={control}
                        name="defaultCurrencyCode"
                        render={({ field, fieldState }) => (
                          <Select
                            value={field.value}
                            onChange={(val) => field.onChange(val)}
                            data={currencyOptions}
                            label={t('defaultCurrencyCode.label')}
                            error={fieldState.error?.message}
                            required
                          />
                        )}
                      />
                      {watchType === 'BASE' && (
                        <Alert
                          variant="light"
                          color="blue"
                          icon={<Info size={16} />}
                        >
                          {t('baseTypeNote')}
                        </Alert>
                      )}
                      <Controller
                        control={control}
                        name="priority"
                        render={({ field, fieldState }) => (
                          <NumberInput
                            value={field.value}
                            onChange={field.onChange}
                            label={t('priority.label')}
                            min={0}
                            error={fieldState.error?.message}
                          />
                        )}
                      />
                      <Controller
                        control={control}
                        name="description"
                        render={({ field, fieldState }) => (
                          <Textarea
                            {...field}
                            value={field.value ?? ''}
                            label={t('description.label')}
                            placeholder={t('description.placeholder')}
                            error={fieldState.error?.message}
                            autosize
                            minRows={3}
                            maxRows={6}
                          />
                        )}
                      />
                    </Stack>
                  </FormCard>

                  <FormCard
                    title={t('validityCard')}
                    icon={Calendar}
                    iconColor="green"
                  >
                    <Stack gap="md">
                      <DateTimeRangeField<PriceListInput>
                        startName="validFrom"
                        endName="validTo"
                        startLabel={t('validFrom.label')}
                        endLabel={t('validTo.label')}
                        mode="both"
                      />
                      {watchType === 'CONTRACT' && (
                        <Controller
                          control={control}
                          name="contractRef"
                          render={({ field, fieldState }) => (
                            <TextInput
                              {...field}
                              value={field.value ?? ''}
                              label={t('contractRef.label')}
                              placeholder={t('contractRef.placeholder')}
                              error={fieldState.error?.message}
                            />
                          )}
                        />
                      )}
                    </Stack>
                  </FormCard>

                  <FormCard
                    title={t('currencyBehaviorCard.title')}
                    description={t('currencyBehaviorCard.description')}
                    icon={ArrowLeftRight}
                    iconColor="violet"
                  >
                    <Stack gap="md">
                      {watchIsSourceLocked && (
                        <Alert
                          color="orange"
                          variant="light"
                          icon={<Lock size={16} />}
                        >
                          {watchSourceSystem &&
                          watchSourceSystem !== 'INTERNAL'
                            ? t('sourceLockedWarning', {
                                sourceSystem: watchSourceSystem,
                              })
                            : t('sourceLockedWarningInternal')}
                        </Alert>
                      )}
                      <Controller
                        control={control}
                        name="isExchangeRateDerived"
                        render={({ field }) => (
                          <Switch
                            checked={field.value}
                            onChange={field.onChange}
                            label={t('isExchangeRateDerived.label')}
                            description={t(
                              'isExchangeRateDerived.description'
                            )}
                          />
                        )}
                      />
                      {watchIsExchangeRateDerived && (
                        <>
                          <Alert
                            color="blue"
                            variant="light"
                            icon={<Info size={16} />}
                          >
                            {t('derivedPricingInfo', {
                              sourceCurrency:
                                watchSourceCurrencyCode ?? '—',
                              defaultCurrency: watchDefaultCurrencyCode,
                            })}
                          </Alert>
                          <Controller
                            control={control}
                            name="sourceCurrencyCode"
                            render={({ field, fieldState }) => (
                              <Select
                                value={field.value ?? null}
                                onChange={(val) => field.onChange(val)}
                                data={currencyOptions}
                                label={t('sourceCurrencyCode.label')}
                                description={t(
                                  'sourceCurrencyCode.description'
                                )}
                                error={fieldState.error?.message}
                                required
                                clearable
                              />
                            )}
                          />
                          <Controller
                            control={control}
                            name="roundingRule"
                            render={({ field, fieldState }) => (
                              <Select
                                value={field.value}
                                onChange={(val) => field.onChange(val)}
                                data={roundingRuleOptions}
                                label={t('roundingRule.label')}
                                description={t('roundingRule.description')}
                                error={fieldState.error?.message}
                              />
                            )}
                          />
                        </>
                      )}
                      <Controller
                        control={control}
                        name="sourceSystem"
                        render={({ field, fieldState }) => (
                          <Select
                            value={field.value}
                            onChange={(val) => field.onChange(val)}
                            data={sourceSystemOptions}
                            label={t('sourceSystem.label')}
                            error={fieldState.error?.message}
                          />
                        )}
                      />
                      <Controller
                        control={control}
                        name="isSourceLocked"
                        render={({ field }) => (
                          <Switch
                            checked={field.value}
                            onChange={field.onChange}
                            label={t('isSourceLocked.label')}
                            description={t('isSourceLocked.description')}
                          />
                        )}
                      />
                    </Stack>
                  </FormCard>
                </Stack>

                <Stack
                  gap="md"
                  style={{
                    width: isMobile ? '100%' : 340,
                    flexShrink: 0,
                    position: isMobile ? undefined : 'sticky',
                    top: isMobile ? undefined : 'var(--mantine-spacing-md)',
                  }}
                >
                  <FormCard
                    title={t('statusCard')}
                    icon={Activity}
                    iconColor="orange"
                  >
                    <Stack gap="md">
                      <Controller
                        control={control}
                        name="status"
                        render={({ field, fieldState }) => (
                          <Select
                            value={field.value}
                            onChange={(val) => field.onChange(val)}
                            data={statusOptions}
                            label={t('status.label')}
                            error={fieldState.error?.message}
                          />
                        )}
                      />
                      <Controller
                        control={control}
                        name="isActive"
                        render={({ field }) => (
                          <Switch
                            checked={field.value}
                            onChange={field.onChange}
                            label={t('isActive')}
                          />
                        )}
                      />
                      {!isNew && data && (
                        <>
                          <Divider />
                          <Stack gap="xs">
                            <Text size="xs" c="dimmed">
                              Created:{' '}
                              {new Date(data.createdAt).toLocaleString()}
                            </Text>
                            <Text size="xs" c="dimmed">
                              Updated:{' '}
                              {new Date(data.updatedAt).toLocaleString()}
                            </Text>
                          </Stack>
                        </>
                      )}
                    </Stack>
                  </FormCard>
                </Stack>
              </Group>
            </Tabs.Panel>

            <Tabs.Panel value="assignments" pt="lg">
              {!isNew && (
                <PriceListAssignmentsTab
                  priceListId={id}
                  storeId={data?.storeId ?? null}
                />
              )}
            </Tabs.Panel>

            <Tabs.Panel value="prices" pt="lg">
              {!isNew && (
                <PriceListPricesTab
                  priceListId={id}
                  defaultCurrencyCode={watchDefaultCurrencyCode}
                />
              )}
            </Tabs.Panel>
          </Tabs>
        </Stack>
      </div>
    </FormProvider>
  );
};

export default AdminPriceListFormPage;
