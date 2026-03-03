'use client';

import {
  useAdminCategory,
  useSaveCategory,
} from '@/core/hooks/useAdminCategory';
import { categoryTreeFetcher } from '@/core/hooks/useAdminLookup';
import { useTranslatedZodResolver } from '@/core/hooks/useTranslatedZodResolver';
import {
  Button,
  Group,
  Stack,
  Switch,
  Text,
  TextInput,
  Textarea,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { DATA_ACCESS_KEYS } from '@org/constants/data-keys';
import { getMimePatterns } from '@org/constants/product-constants';
import { FileType } from '@org/prisma/browser';
import {
  CategoryInput,
  CategoryOutput,
  CategorySchema,
  NEW_CATEGORY_DEFAULT_VALUES,
} from '@org/schemas/admin/categories';
import { FormCard } from '@org/ui/common/form-card';
import LoadingOverlay from '@org/ui/common/loading-overlay';
import { Dropzone } from '@org/ui/dropzone';
import { ProductSeoCard } from '@org/ui/inputs/product-seo-card';
import { RelationDrawer } from '@org/ui/inputs/relation-drawer';
import { createId } from '@paralleldrive/cuid2';
import {
  Activity,
  Building,
  FileText,
  Image as ImageIcon,
  Save,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useMemo } from 'react';
import {
  Controller,
  FormProvider,
  SubmitHandler,
  useForm,
} from 'react-hook-form';

const AdminCategoryFormPage = () => {
  const t = useTranslations('frontend.admin.categories.form');
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const isNew = id === 'new';
  const { data, isLoading } = useAdminCategory(id);
  const saveCategory = useSaveCategory();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const formattedData = useMemo<CategoryInput>(() => {
    if (!data || isNew) {
      return { ...NEW_CATEGORY_DEFAULT_VALUES, uniqueId: createId() };
    }

    return {
      uniqueId: data.id,
      slug: data.slug,
      parentId: data.parentId ?? '',
      isActive: data.isActive,
      translations: data.translations.map((tr) => ({
        locale: tr.locale,
        name: tr.name,
        description: tr.description ?? '',
        metaTitle: tr.metaTitle ?? null,
        metaDescription: tr.metaDescription ?? null,
      })),
      images: [],
      existingImages:
        data.images?.map((img) => ({
          id: img.id,
          url: img.url,
          fileType: img.fileType,
          sortOrder: img.sortOrder,
        })) ?? [],
    };
  }, [data, isNew]);

  const resolver = useTranslatedZodResolver(CategorySchema);
  const methods = useForm<CategoryInput>({
    resolver,
    defaultValues: NEW_CATEGORY_DEFAULT_VALUES,
    values: formattedData,
  });

  const {
    control,
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = methods;

  const categoryName = watch('translations.0.name');

  const onSubmit: SubmitHandler<CategoryInput> = async (formData) => {
    await saveCategory.mutateAsync(formData as unknown as CategoryOutput);
    router.push('/admin/products/categories');
  };

  if (isLoading && !isNew) return <LoadingOverlay />;

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack gap="lg">
          <div>
            <Group justify="space-between" align="center">
              <Text size="xl" fw={700} lh={1.2}>
                {categoryName || (isNew ? t('newCategory') : '\u2014')}
              </Text>
              <Group gap="sm">
                <Button
                  variant="default"
                  onClick={() => router.push('/admin/products/categories')}
                >
                  {t('discard')}
                </Button>
                <Button
                  type="submit"
                  leftSection={<Save size={16} />}
                  loading={isSubmitting}
                >
                  {t('save')}
                </Button>
              </Group>
            </Group>
          </div>

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
                    name="translations.0.name"
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
                    name="translations.0.description"
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
                title={t('media.title')}
                description={t('media.description')}
                icon={ImageIcon}
                iconColor="grape"
              >
                <Controller
                  control={control}
                  name="images"
                  render={({ field }) => (
                    <Dropzone
                      value={field.value}
                      onChange={field.onChange}
                      accept={getMimePatterns([FileType.IMAGE])}
                      maxSize={5 * 1024 * 1024}
                      multiple
                      maxFiles={5}
                    />
                  )}
                />
              </FormCard>

              <ProductSeoCard
                locale="TR"
                slugName="slug"
                metaTitleName="translations.0.metaTitle"
                metaDescriptionName="translations.0.metaDescription"
              />
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
                icon={Activity}
                iconColor="orange"
              >
                <Controller
                  control={control}
                  name="isActive"
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onChange={field.onChange}
                      label={t('statusCard.activeLabel')}
                    />
                  )}
                />
              </FormCard>

              <FormCard
                title={t('organization')}
                icon={Building}
                iconColor="teal"
              >
                <Controller
                  control={control}
                  name="parentId"
                  render={({ field, fieldState }) => (
                    <RelationDrawer
                      queryKey={DATA_ACCESS_KEYS.admin.categories.lookup}
                      fetchOptions={categoryTreeFetcher}
                      tree
                      value={field.value || null}
                      onChange={field.onChange}
                      title={t('parent.label')}
                      label={t('parent.label')}
                      placeholder={t('parent.placeholder')}
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </FormCard>
            </Stack>
          </Group>
        </Stack>
      </form>
    </FormProvider>
  );
};

export default AdminCategoryFormPage;
