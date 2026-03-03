'use client';

import { Box, Grid, Stack, Text, TextInput, Textarea } from '@mantine/core';
import { Locale } from '@org/prisma/browser';
import { Globe } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  Controller,
  useFormContext,
  useWatch,
  type FieldValues,
  type Path,
  type PathValue,
} from 'react-hook-form';
import { FormCard } from '../../common/form-card';

export interface ProductSeoCardProps<T extends FieldValues> {
  locale: Locale;
  slugName: Path<T>;
  metaTitleName: Path<T>;
  metaDescriptionName: Path<T>;
  defaultValue?: {
    slug?: string;
    metaTitle?: string;
    metaDescription?: string;
  };
}

const ProductSeoCard = <T extends FieldValues>({
  locale,
  slugName,
  metaTitleName,
  metaDescriptionName,
  defaultValue = {},
}: ProductSeoCardProps<T>) => {
  const { control } = useFormContext<T>();
  const t = useTranslations('frontend.seoCard');

  const slug = useWatch({
    control,
    name: slugName,
    defaultValue: (defaultValue.slug || '') as PathValue<T, Path<T>>,
  });

  const metaTitle = useWatch({
    control,
    name: metaTitleName,
    defaultValue: (defaultValue.metaTitle || '') as PathValue<T, Path<T>>,
  });

  const metaDescription = useWatch({
    control,
    name: metaDescriptionName,
    defaultValue: (defaultValue.metaDescription || '') as PathValue<T, Path<T>>,
  });

  return (
    <FormCard title={`${t('title')}`} icon={Globe} iconColor="indigo">
      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Stack>
            <Controller
              name={slugName}
              control={control}
              defaultValue={(defaultValue.slug || '') as PathValue<T, Path<T>>}
              render={({ field, fieldState }) => (
                <TextInput
                  {...field}
                  withAsterisk
                  label={t('fields.slug.label')}
                  placeholder={t('fields.slug.placeholder')}
                  error={fieldState.error?.message}
                />
              )}
            />

            <Controller
              name={metaTitleName}
              control={control}
              defaultValue={
                (defaultValue.metaTitle || '') as PathValue<T, Path<T>>
              }
              render={({ field, fieldState }) => (
                <TextInput
                  {...field}
                  label={t('fields.metaTitle.label')}
                  placeholder={t('fields.metaTitle.placeholder')}
                  error={fieldState.error?.message}
                />
              )}
            />

            <Controller
              name={metaDescriptionName}
              control={control}
              defaultValue={
                (defaultValue.metaDescription || '') as PathValue<T, Path<T>>
              }
              render={({ field, fieldState }) => (
                <Textarea
                  {...field}
                  label={t('fields.metaDescription.label')}
                  placeholder={t('fields.metaDescription.placeholder')}
                  rows={4}
                  error={fieldState.error?.message}
                />
              )}
            />
          </Stack>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Stack>
            <Text fw={500} size="sm" c="dimmed">
              {t('preview.title')}
            </Text>
            <Box
              p="md"
              style={{
                border: '1px solid var(--mantine-color-default-border)',
                fontFamily: 'arial, sans-serif',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '4px',
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    backgroundColor: 'var(--mantine-color-gray-2)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Globe size={16} color="var(--mantine-color-gray-6)" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <Text size="sm" c="dark" style={{ lineHeight: 1.2 }}>
                    Your Site Name
                  </Text>
                  <Text
                    size="xs"
                    c="dimmed"
                    style={{ wordBreak: 'break-all', lineHeight: 1.2 }}
                  >
                    https://yoursite.com › {locale?.toLocaleLowerCase()} ›{' '}
                    {slug || t('preview.defaultSlug')}
                  </Text>
                </div>
              </div>

              <Text
                size="xl"
                c="blue"
                style={{
                  lineHeight: 1.3,
                  marginTop: '8px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  cursor: 'pointer',
                  textDecoration: 'none',
                }}
              >
                {metaTitle || t('preview.defaultMetaTitle')}
              </Text>

              <Text
                size="sm"
                c="#4d5156"
                style={{
                  marginTop: '4px',
                  lineHeight: 1.58,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {metaDescription || t('preview.defaultMetaDescription')}
              </Text>
            </Box>
          </Stack>
        </Grid.Col>
      </Grid>
    </FormCard>
  );
};

export default ProductSeoCard;
