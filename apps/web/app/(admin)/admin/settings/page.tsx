'use client';

import {
  useSaveStoreSettings,
  useStoreSettings,
} from '@/core/hooks/useAdminSettings';
import { useAdminStores } from '@/core/hooks/useAdminStores';
import { useTranslatedZodResolver } from '@/core/hooks/useTranslatedZodResolver';
import {
  Button,
  Group,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Locale } from '@org/prisma/browser';
import {
  UpdateStoreSchema,
  type UpdateStoreInput,
} from '@org/schemas/admin/settings';
import { FormCard } from '@org/ui/common/form-card';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

const LOCALE_OPTIONS = Object.values(Locale).map((l) => ({
  value: l,
  label: l,
}));

export default function SettingsPage() {
  const t = useTranslations('frontend.admin.settings');
  const { data: stores } = useAdminStores();
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  useEffect(() => {
    if (stores?.length && !selectedStoreId) {
      setSelectedStoreId(stores[0].id);
    }
  }, [stores, selectedStoreId]);

  const { data } = useStoreSettings(selectedStoreId ?? undefined);
  const saveSettings = useSaveStoreSettings({
    storeId: selectedStoreId ?? undefined,
    onSuccess: () =>
      notifications.show({ color: 'green', message: t('form.success') }),
    onError: () =>
      notifications.show({ color: 'red', message: t('form.error') }),
  });

  const resolver = useTranslatedZodResolver(UpdateStoreSchema);

  const form = useForm<UpdateStoreInput>({
    resolver,
    defaultValues: {
      name: '',
      defaultLocale: Locale.TR,
      currency: undefined,
      timezone: '',
    },
  });

  useEffect(() => {
    if (data) {
      form.reset({
        name: data.name,
        defaultLocale:
          data.defaultLocale as (typeof Locale)[keyof typeof Locale],
        currency: data.currency ?? undefined,
        timezone: data.timezone ?? undefined,
      });
    }
  }, [data, form]);

  const onSubmit = form.handleSubmit((values) => {
    saveSettings.mutate(values);
  });

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>{t('title')}</Title>
        <Text c="dimmed" mt="xs">
          {t('subtitle')}
        </Text>
      </div>

      {stores && stores.length > 1 && (
        <Select
          label={t('form.selectStore')}
          data={stores.map((s) => ({ value: s.id, label: s.name }))}
          value={selectedStoreId}
          onChange={setSelectedStoreId}
        />
      )}

      <FormCard title={t('title')}>
        <form onSubmit={onSubmit}>
          <Stack gap="md">
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <TextInput
                  {...field}
                  label={t('form.storeName.label')}
                  placeholder={t('form.storeName.placeholder')}
                  error={fieldState.error?.message}
                />
              )}
            />

            <Controller
              control={form.control}
              name="defaultLocale"
              render={({ field, fieldState }) => (
                <Select
                  label={t('form.defaultLocale.label')}
                  placeholder={t('form.defaultLocale.placeholder')}
                  data={LOCALE_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />

            <Controller
              control={form.control}
              name="currency"
              render={({ field, fieldState }) => (
                <TextInput
                  {...field}
                  value={field.value ?? ''}
                  label={t('form.currency.label')}
                  placeholder={t('form.currency.placeholder')}
                  error={fieldState.error?.message}
                />
              )}
            />

            <Controller
              control={form.control}
              name="timezone"
              render={({ field, fieldState }) => (
                <TextInput
                  {...field}
                  value={field.value ?? ''}
                  label={t('form.timezone.label')}
                  placeholder={t('form.timezone.placeholder')}
                  error={fieldState.error?.message}
                />
              )}
            />

            <Group justify="flex-end">
              <Button type="submit" loading={saveSettings.isPending}>
                {t('form.submit')}
              </Button>
            </Group>
          </Stack>
        </form>
      </FormCard>
    </Stack>
  );
}
