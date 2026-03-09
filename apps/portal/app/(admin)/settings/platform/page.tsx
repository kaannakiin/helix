'use client';

import {
  usePlatformInstallation,
  useSavePlatformInstallation,
} from '@/core/hooks/useAdminSettings';
import { useTranslatedZodResolver } from '@org/hooks/useTranslatedZodResolver';
import {
  Button,
  Code,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  PlatformInstallationSchema,
  type PlatformInstallationInput,
  type PlatformInstallationOutput,
} from '@org/schemas/admin/settings';
import { FormCard } from '@org/ui/common/form-card';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';

function parseLines(value: string): string[] {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function PlatformSettingsPage() {
  const t = useTranslations('frontend.admin.settings');
  const { data: platformInstallation } = usePlatformInstallation();

  const installationResolver = useTranslatedZodResolver(
    PlatformInstallationSchema
  );

  const installationForm = useForm<
    PlatformInstallationInput,
    unknown,
    PlatformInstallationOutput
  >({
    resolver: installationResolver,
    defaultValues: {
      name: '',
      portalHostname: '',
      tlsAskSecret: '',
      ingress: {
        canonicalTargetHost: '',
        ipv4Addresses: [],
        ipv6Addresses: [],
      },
    },
  });

  useEffect(() => {
    installationForm.reset({
      name: platformInstallation?.name ?? '',
      portalHostname: platformInstallation?.portalHostname ?? '',
      tlsAskSecret: platformInstallation?.tlsAskSecret ?? '',
      ingress: {
        canonicalTargetHost:
          platformInstallation?.ingress?.canonicalTargetHost ?? '',
        ipv4Addresses: platformInstallation?.ingress?.ipv4Addresses ?? [],
        ipv6Addresses: platformInstallation?.ingress?.ipv6Addresses ?? [],
      },
    });
  }, [installationForm, platformInstallation]);

  const savePlatformInstallation = useSavePlatformInstallation({
    onSuccess: () =>
      notifications.show({
        color: 'green',
        message: t('notifications.installationSaved'),
      }),
    onError: (error: Error) =>
      notifications.show({
        color: 'red',
        message: error.message || t('notifications.genericError'),
      }),
  });

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>{t('installation.title')}</Title>
        <Text c="dimmed" mt="xs">
          {t('installation.description')}
        </Text>
      </div>

      <FormCard
        title={t('installation.title')}
        description={t('installation.description')}
      >
        <form
          onSubmit={installationForm.handleSubmit((values) =>
            savePlatformInstallation.mutate(values)
          )}
        >
          <Stack gap="md">
            <SimpleGrid cols={{ base: 1, md: 2 }}>
              <Controller
                control={installationForm.control}
                name="name"
                render={({ field, fieldState }) => (
                  <TextInput
                    {...field}
                    label={t('installation.fields.name.label')}
                    placeholder={t('installation.fields.name.placeholder')}
                    error={fieldState.error?.message}
                  />
                )}
              />

              <Controller
                control={installationForm.control}
                name="portalHostname"
                render={({ field, fieldState }) => (
                  <TextInput
                    {...field}
                    value={typeof field.value === 'string' ? field.value : ''}
                    label={t('installation.fields.portalHostname.label')}
                    placeholder={t(
                      'installation.fields.portalHostname.placeholder'
                    )}
                    error={fieldState.error?.message}
                  />
                )}
              />
            </SimpleGrid>

            <Controller
              control={installationForm.control}
              name="tlsAskSecret"
              render={({ field, fieldState }) => (
                <TextInput
                  {...field}
                  value={typeof field.value === 'string' ? field.value : ''}
                  label={t('installation.fields.tlsAskSecret.label')}
                  placeholder={t(
                    'installation.fields.tlsAskSecret.placeholder'
                  )}
                  description={t(
                    'installation.fields.tlsAskSecret.description'
                  )}
                  error={fieldState.error?.message}
                />
              )}
            />

            <SimpleGrid cols={{ base: 1, md: 3 }}>
              <Controller
                control={installationForm.control}
                name="ingress.canonicalTargetHost"
                render={({ field, fieldState }) => (
                  <TextInput
                    {...field}
                    value={typeof field.value === 'string' ? field.value : ''}
                    label={t('installation.fields.canonicalTargetHost.label')}
                    placeholder={t(
                      'installation.fields.canonicalTargetHost.placeholder'
                    )}
                    description={t(
                      'installation.fields.canonicalTargetHost.description'
                    )}
                    error={fieldState.error?.message}
                  />
                )}
              />

              <Controller
                control={installationForm.control}
                name="ingress.ipv4Addresses"
                render={({ field, fieldState }) => (
                  <Textarea
                    label={t('installation.fields.ipv4Addresses.label')}
                    placeholder={t(
                      'installation.fields.ipv4Addresses.placeholder'
                    )}
                    description={t(
                      'installation.fields.ipv4Addresses.description'
                    )}
                    value={(field.value ?? []).join('\n')}
                    onChange={(event) =>
                      field.onChange(parseLines(event.currentTarget.value))
                    }
                    minRows={4}
                    error={fieldState.error?.message}
                  />
                )}
              />

              <Controller
                control={installationForm.control}
                name="ingress.ipv6Addresses"
                render={({ field, fieldState }) => (
                  <Textarea
                    label={t('installation.fields.ipv6Addresses.label')}
                    placeholder={t(
                      'installation.fields.ipv6Addresses.placeholder'
                    )}
                    description={t(
                      'installation.fields.ipv6Addresses.description'
                    )}
                    value={(field.value ?? []).join('\n')}
                    onChange={(event) =>
                      field.onChange(parseLines(event.currentTarget.value))
                    }
                    minRows={4}
                    error={fieldState.error?.message}
                  />
                )}
              />
            </SimpleGrid>

            <Paper withBorder radius="md" p="md">
              <Stack gap={6}>
                <Text fw={600} size="sm">
                  {t('installation.ask.title')}
                </Text>
                <Text size="sm" c="dimmed">
                  {t('installation.ask.description')}
                </Text>
                {platformInstallation?.tlsAskSecret ? (
                  <Code
                    block
                  >{`/api/storefront/domains/ask?domain={host}&token=${platformInstallation.tlsAskSecret}`}</Code>
                ) : (
                  <Text size="sm" c="dimmed">
                    {t('installation.ask.empty')}
                  </Text>
                )}
              </Stack>
            </Paper>

            <Group justify="flex-end">
              <Button
                type="submit"
                loading={savePlatformInstallation.isPending}
              >
                {t('installation.submit')}
              </Button>
            </Group>
          </Stack>
        </form>
      </FormCard>
    </Stack>
  );
}
