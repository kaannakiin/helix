'use client';

import {
  useAdminStore,
  useCreateStore,
  useUpdateStore,
} from '@/core/hooks/useAdminStores';
import { ApiError } from '@/core/lib/api/api-error';
import {
  Alert,
  Badge,
  Button,
  Group,
  Select,
  Stack,
  Tabs,
  Text,
  TextInput,
  Textarea,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  BusinessModelConfigs,
  StoreStatusConfigs,
  StorefrontStatusConfigs,
  buildEnumOptions,
} from '@org/constants/enum-configs';
import { TIMEZONE_OPTIONS } from '@org/constants/timezone-constants';
import { useTranslatedZodResolver } from '@org/hooks/useTranslatedZodResolver';
import type { Store } from '@org/prisma/browser';
import {
  CreateStoreSchema,
  type CreateStoreInput,
  type CreateStoreOutput,
  type UpdateStoreOutput,
} from '@org/schemas/admin/settings';
import { FormCard } from '@org/ui/common/form-card';
import LoadingOverlay from '@org/ui/common/loading-overlay';
import { slugify } from '@org/utils/slugify';
import { Activity, FileText, Globe, Save } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StoreCurrencyPolicyCard } from './components/StoreCurrencyPolicyCard';
import { StoreDomainStatusCard } from './components/StoreDomainStatusCard';

const NEW_STORE_DEFAULTS: CreateStoreInput = {
  name: '',
  slug: '',
  businessModel: 'B2C',
  status: 'ACTIVE',
  defaultLocale: 'TR',
  defaultCurrencyCode: 'TRY',
  timezone: 'Europe/Istanbul',
  description: '',
};

export default function StoreDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const isNew = id === 'new';
  const isMobile = useMediaQuery('(max-width: 768px)');
  const activeTab = searchParams.get('tab') ?? 'general';

  const t = useTranslations('frontend.admin.stores.form');
  const tDomains = useTranslations('frontend.admin.stores.domains');
  const tTabs = useTranslations('frontend.admin.stores.tabs');
  const tCurrencies = useTranslations('frontend.admin.stores.currencies');
  const tEnums = useTranslations('frontend.enums');

  const { data, isLoading, isError, error } = useAdminStore(
    isNew ? undefined : id
  );
  const apiError = error as ApiError | null;

  const formattedData = useMemo(() => {
    if (!data || isNew) return NEW_STORE_DEFAULTS;
    return {
      name: data.name,
      slug: data.slug,
      businessModel: data.businessModel,
      status: data.status,
      defaultLocale: data.defaultLocale,
      defaultCurrencyCode: data.defaultCurrencyCode,
      timezone: data.timezone ?? '',
      description: data.description ?? '',
      logoUrl: data.logoUrl ?? '',
    } satisfies CreateStoreInput;
  }, [data, isNew]);

  const resolver = useTranslatedZodResolver(CreateStoreSchema);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm<CreateStoreInput, unknown, CreateStoreOutput>({
    resolver,
    defaultValues: NEW_STORE_DEFAULTS,
    values: formattedData,
  });

  const storeName = watch('name');

  const createStore = useCreateStore({
    onSuccess: (result: Store) => {
      notifications.show({ color: 'green', message: t('createSuccess') });
      router.push(`/stores/${result.id}`);
    },
    onError: (err) =>
      notifications.show({
        color: 'red',
        message: err.message || t('saveError'),
      }),
  });

  const updateStore = useUpdateStore({
    storeId: isNew ? undefined : id,
    onSuccess: () =>
      notifications.show({ color: 'green', message: t('saveSuccess') }),
    onError: (err) =>
      notifications.show({
        color: 'red',
        message: err.message || t('saveError'),
      }),
  });

  const onSubmit = async (formData: CreateStoreOutput) => {
    if (isNew) {
      await createStore.mutateAsync(formData);
    } else {
      await updateStore.mutateAsync(formData as UpdateStoreOutput);
    }
  };

  const storeStatusOptions = buildEnumOptions(StoreStatusConfigs, tEnums);
  const businessModelOptions = buildEnumOptions(BusinessModelConfigs, tEnums);
  const localeOptions = [
    { value: 'TR', label: 'TR' },
    { value: 'EN', label: 'EN' },
  ];
  const currencyOptions = [
    { value: 'TRY', label: 'TRY' },
    { value: 'USD', label: 'USD' },
    { value: 'EUR', label: 'EUR' },
    { value: 'GBP', label: 'GBP' },
  ];

  const handleTabChange = (value: string | null) => {
    if (!value) return;
    const params = new URLSearchParams();
    if (value !== 'general') {
      params.set('tab', value);
    }
    const query = params.toString();
    router.push(`/stores/${id}${query ? `?${query}` : ''}`, {
      scroll: false,
    });
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
        <Button variant="default" onClick={() => router.push('/stores')}>
          {t('backToStores')}
        </Button>
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      <div>
        <Group justify="space-between" align="center">
          <Text size="xl" fw={700} lh={1.2}>
            {storeName || (isNew ? t('newStore') : '—')}
          </Text>
          {activeTab === 'general' && (
            <Group gap="sm">
              <Button variant="default" onClick={() => router.push('/stores')}>
                {t('discard')}
              </Button>
              <Button
                type="submit"
                form="store-form"
                leftSection={<Save size={16} />}
                loading={isSubmitting}
              >
                {t('save')}
              </Button>
            </Group>
          )}
        </Group>
      </div>

      {isNew ? (
        <GeneralTabContent
          control={control}
          handleSubmit={handleSubmit}
          onSubmit={onSubmit}
          setValue={setValue}
          isNew={isNew}
          isMobile={isMobile}
          data={data}
          t={t}
          tEnums={tEnums}
          storeStatusOptions={storeStatusOptions}
          businessModelOptions={businessModelOptions}
          localeOptions={localeOptions}
          currencyOptions={currencyOptions}
          storeName={storeName}
        />
      ) : (
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tabs.List>
            <Tabs.Tab value="general">{tTabs('general')}</Tabs.Tab>
            <Tabs.Tab value="domains">{tTabs('domains')}</Tabs.Tab>
            <Tabs.Tab value="currencies">{tTabs('currencies')}</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="general" pt="md">
            <GeneralTabContent
              control={control}
              handleSubmit={handleSubmit}
              onSubmit={onSubmit}
              setValue={setValue}
              isNew={isNew}
              isMobile={isMobile}
              data={data}
              t={t}
              tEnums={tEnums}
              storeStatusOptions={storeStatusOptions}
              businessModelOptions={businessModelOptions}
              localeOptions={localeOptions}
              currencyOptions={currencyOptions}
              storeName={storeName}
            />
          </Tabs.Panel>

          <Tabs.Panel value="domains" pt="md">
            <Stack gap="md">
              <div>
                <Text size="lg" fw={600}>
                  {tDomains('title')}
                </Text>
                <Text size="sm" c="dimmed">
                  {tDomains('subtitle')}
                </Text>
              </div>
              <StoreDomainStatusCard
                storeId={id}
                storefrontStatus={data?.storefrontStatus}
              />
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="currencies" pt="md">
            <Stack gap="md">
              <div>
                <Text size="lg" fw={600}>
                  {tCurrencies('title')}
                </Text>
                <Text size="sm" c="dimmed">
                  {tCurrencies('subtitle')}
                </Text>
              </div>
              <StoreCurrencyPolicyCard storeId={id} store={data} />
            </Stack>
          </Tabs.Panel>
        </Tabs>
      )}
    </Stack>
  );
}

function GeneralTabContent({
  control,
  handleSubmit,
  onSubmit,
  setValue,
  isNew,
  isMobile,
  data,
  t,
  tEnums,
  storeStatusOptions,
  businessModelOptions,
  localeOptions,
  currencyOptions,
  storeName,
}: {
  control: any;
  handleSubmit: any;
  onSubmit: any;
  setValue: any;
  isNew: boolean;
  isMobile: boolean | undefined;
  data: Store | undefined;
  t: any;
  tEnums: any;
  storeStatusOptions: any[];
  businessModelOptions: any[];
  localeOptions: any[];
  currencyOptions: any[];
  storeName: string;
}) {
  return (
    <form id="store-form" onSubmit={handleSubmit(onSubmit)}>
      <Group align="flex-start" gap="lg" wrap="wrap">
        <Stack gap="md" style={{ flex: 1, minWidth: isMobile ? '100%' : 400 }}>
          <FormCard
            title={t('generalInfo')}
            description={t('generalInfoDescription')}
            icon={FileText}
            iconColor="blue"
          >
            <Stack gap="md">
              <Controller
                control={control}
                name="name"
                render={({ field, fieldState }: any) => (
                  <TextInput
                    {...field}
                    label={t('name.label')}
                    placeholder={t('name.placeholder')}
                    error={fieldState.error?.message}
                    onChange={(e: any) => {
                      field.onChange(e);
                      if (isNew) {
                        setValue('slug', slugify(e.currentTarget.value));
                      }
                    }}
                  />
                )}
              />

              <Controller
                control={control}
                name="slug"
                render={({ field, fieldState }: any) => (
                  <TextInput
                    {...field}
                    label={t('slug.label')}
                    placeholder={t('slug.placeholder')}
                    description={isNew ? t('slug.hint') : undefined}
                    error={fieldState.error?.message}
                    disabled={!isNew}
                  />
                )}
              />

              <Controller
                control={control}
                name="description"
                render={({ field, fieldState }: any) => (
                  <Textarea
                    {...field}
                    value={field.value ?? ''}
                    label={t('description.label')}
                    placeholder={t('description.placeholder')}
                    error={fieldState.error?.message}
                    minRows={3}
                  />
                )}
              />
            </Stack>
          </FormCard>

          <FormCard
            title={t('regionCard.title')}
            description={t('regionCard.description')}
            icon={Globe}
            iconColor="teal"
          >
            <Stack gap="md">
              <Controller
                control={control}
                name="businessModel"
                render={({ field, fieldState }: any) => (
                  <Select
                    label={t('businessModel.label')}
                    placeholder={t('businessModel.placeholder')}
                    data={businessModelOptions}
                    value={field.value}
                    onChange={field.onChange}
                    error={fieldState.error?.message}
                  />
                )}
              />

              <Group grow>
                <Controller
                  control={control}
                  name="defaultLocale"
                  render={({ field, fieldState }: any) => (
                    <Select
                      label={t('defaultLocale.label')}
                      placeholder={t('defaultLocale.placeholder')}
                      data={localeOptions}
                      value={field.value}
                      onChange={field.onChange}
                      error={fieldState.error?.message}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="defaultCurrencyCode"
                  render={({ field, fieldState }: any) => (
                    <Select
                      label={t('currency.label')}
                      placeholder={t('currency.placeholder')}
                      data={currencyOptions}
                      value={field.value}
                      onChange={field.onChange}
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </Group>

              <Controller
                control={control}
                name="timezone"
                render={({ field, fieldState }: any) => (
                  <Select
                    label={t('timezone.label')}
                    placeholder={t('timezone.placeholder')}
                    data={TIMEZONE_OPTIONS}
                    value={field.value ?? null}
                    onChange={field.onChange}
                    error={fieldState.error?.message}
                    searchable
                    clearable
                    nothingFoundMessage={t('timezone.notFound')}
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
            title={t('statusCard.title')}
            description={t('statusCard.description')}
            icon={Activity}
            iconColor="orange"
          >
            <Stack gap="md">
              <Controller
                control={control}
                name="status"
                render={({ field, fieldState }: any) => (
                  <Select
                    label={t('status.label')}
                    data={storeStatusOptions}
                    value={field.value}
                    onChange={field.onChange}
                    error={fieldState.error?.message}
                  />
                )}
              />

              {!isNew && data && (
                <div>
                  <Text size="sm" fw={500} mb={4}>
                    {t('storefrontStatus.label')}
                  </Text>
                  <Badge
                    color={
                      StorefrontStatusConfigs[data.storefrontStatus]?.color ??
                      'gray'
                    }
                    variant="light"
                  >
                    {tEnums(`storefrontStatus.${data.storefrontStatus}`)}
                  </Badge>
                </div>
              )}
            </Stack>
          </FormCard>
        </Stack>
      </Group>
    </form>
  );
}
