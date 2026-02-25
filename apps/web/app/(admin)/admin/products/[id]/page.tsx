'use client';

import {
  brandLookupFetcher,
  categoryLookupFetcher,
  tagLookupFetcher,
} from '@/core/hooks/useAdminLookup';
import { useAdminProduct } from '@/core/hooks/useAdminProducts';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Divider,
  Group,
  Select,
  Stack,
  Text,
  TextInput,
  Textarea,
} from '@mantine/core';
import { DATA_ACCESS_KEYS } from '@org/constants/data-keys';
import {
  ProductStatusConfigs,
  ProductTypeConfigs,
  buildEnumOptions,
} from '@org/constants/enum-configs';
import { getMimePatterns } from '@org/constants/product-constants';
import { FileType } from '@org/prisma/browser';
import {
  NEW_PRODUCT_DEFAULT_VALUES,
  ProductInputType,
  ProductSchema,
} from '@org/schemas/admin/products';
import { FormCard } from '@org/ui/common/form-card';
import LoadingOverlay from '@org/ui/common/loading-overlay';
import { Dropzone } from '@org/ui/dropzone';
import { ProductSeoCard } from '@org/ui/inputs/product-seo-card';
import { RelationInput } from '@org/ui/inputs/relation-input';
import { RichTextEditor } from '@org/ui/inputs/rich-text-editor';
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
import { VariantCreator } from './components/VariantCreator';

const AdminProductPage = () => {
  const t = useTranslations('common.admin.products.form');
  const tEnums = useTranslations('common.enums');
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const isNew = id === 'new';
  const { data, isLoading } = useAdminProduct(id);

  const formattedData = useMemo<ProductInputType>(() => {
    if (!data || isNew) return NEW_PRODUCT_DEFAULT_VALUES;

    return {
      type: data.type,
      status: data.status,
      hasVariants: (data.variantGroups?.length ?? 0) > 0,
      brandId: data.brand?.id ?? '',
      translations: data.translations.map((tr) => ({
        locale: tr.locale,
        name: tr.name,
        slug: tr.slug,
        shortDescription: tr.shortDescription ?? '',
        description: tr.description ?? '',
      })),
      newImages: [],
      existingImages:
        data.images?.map((img) => ({
          id: img.id,
          url: img.url,
          fileType: img.fileType,
          sortOrder: img.sortOrder,
        })) ?? [],
      variantGroups:
        data.variantGroups?.map((pvg) => ({
          uniqueId: pvg.variantGroup.id,
          type: pvg.variantGroup.type,
          sortOrder: pvg.sortOrder,
          displayMode: pvg.displayMode ?? null,
          translations: pvg.variantGroup.translations.map((tr) => ({
            locale: tr.locale,
            name: tr.name,
            slug: tr.slug,
          })),
          options: pvg.variantGroup.options.map((opt) => ({
            uniqueId: opt.id,
            colorCode: opt.colorCode ?? '',
            sortOrder: opt.sortOrder,
            translations: opt.translations.map((tr) => ({
              locale: tr.locale,
              name: tr.name,
              slug: tr.slug,
            })),
            images: undefined,
            existingImages: opt.images.map((img) => ({
              id: img.id,
              url: img.url,
              fileType: img.fileType,
              sortOrder: img.sortOrder,
            })),
          })),
        })) ?? [],
      variants:
        data.variants?.map((v) => ({
          uniqueId: v.id,
          uniqueKey: v.optionValues
            .map((ov) => ov.variantOption.id)
            .sort()
            .join('|'),
          optionValueIds: v.optionValues.map((ov) => ov.variantOption.id),
          sku: v.sku ?? '',
          barcode: v.barcode ?? '',
          isActive: v.isActive,
          trackingStrategy: v.trackingStrategy,
          sortOrder: v.sortOrder,
          newImages: [],
          existingImages:
            v.images?.map((img) => ({
              id: img.id,
              url: img.url,
              fileType: img.fileType,
              sortOrder: img.sortOrder,
            })) ?? [],
        })) ?? [],
      categories:
        data.categories?.map((c, i) => ({
          categoryId: c.category.id,
          sortOrder: i,
        })) ?? [],
      tagIds: data.tags?.map((t) => t.tag.id) ?? [],
      uniqueId: data.id,
    };
  }, [data, isNew]);

  const methods = useForm<ProductInputType>({
    resolver: zodResolver(ProductSchema),
    defaultValues: formattedData ?? NEW_PRODUCT_DEFAULT_VALUES,
  });

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = methods;

  const productName = watch('translations.0.name');

  const onSubmit: SubmitHandler<ProductInputType> = (data) => {
    console.log(data);
  };

  if (isLoading) return <LoadingOverlay />;

  const statusOptions = buildEnumOptions(ProductStatusConfigs, tEnums);

  const typeOptions = buildEnumOptions(ProductTypeConfigs, tEnums);

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap="lg">
          <div>
            <Group justify="space-between" align="center">
              <Text size="xl" fw={700} lh={1.2}>
                {productName || (isNew ? t('newProduct') : '—')}
              </Text>
              <Group gap="sm">
                <Button
                  variant="default"
                  onClick={() => router.push('/admin/products')}
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

          <Group
            align="flex-start"
            gap="lg"
            wrap="wrap"
            style={{ flexWrap: 'wrap' }}
          >
            <Stack gap="md" style={{ flex: 1, minWidth: 0 }}>
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
                    name="translations.0.shortDescription"
                    render={({ field, fieldState }) => (
                      <Textarea
                        {...field}
                        value={field.value ?? ''}
                        label={t('shortDescription.label')}
                        placeholder={t('shortDescription.placeholder')}
                        error={fieldState.error?.message}
                        autosize
                        minRows={2}
                        maxRows={4}
                      />
                    )}
                  />
                  <RichTextEditor
                    name="translations.0.description"
                    labelKey="admin.products.form.description.label"
                    placeholderKey="admin.products.form.description.placeholder"
                    descriptionKey="admin.products.form.description.description"
                    minHeight={200}
                  />
                </Stack>
              </FormCard>
              <VariantCreator isNew={isNew} />

              <FormCard
                title={t('media.title')}
                description={t('media.description')}
                icon={ImageIcon}
                iconColor="grape"
              >
                <Controller
                  control={control}
                  name="newImages"
                  render={({ field }) => (
                    <Dropzone
                      value={field.value}
                      onChange={field.onChange}
                      accept={getMimePatterns([FileType.IMAGE, FileType.VIDEO])}
                      maxSize={5 * 1024 * 1024}
                      multiple
                      maxFiles={10}
                    />
                  )}
                />
              </FormCard>

              <ProductSeoCard
                locale="TR"
                slugName="translations.0.slug"
                metaTitleName="translations.0.metaTitle"
                metaDescriptionName="translations.0.metaDescription"
              />
            </Stack>

            <Stack gap="md" style={{ width: 340, flexShrink: 0 }}>
              <FormCard
                title={t('statusCard.title')}
                icon={Activity}
                iconColor="orange"
              >
                <Stack gap="md">
                  <Controller
                    control={control}
                    name="status"
                    render={({ field, fieldState }) => (
                      <Select
                        {...field}
                        label={t('status.label')}
                        data={statusOptions}
                        error={fieldState.error?.message}
                        allowDeselect={false}
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name="type"
                    render={({ field, fieldState }) => (
                      <Select
                        {...field}
                        label={t('type.label')}
                        data={typeOptions}
                        error={fieldState.error?.message}
                        allowDeselect={false}
                      />
                    )}
                  />
                  <Divider />
                  <div>
                    <Text size="xs" fw={500} c="dimmed" mb={4}>
                      {t('statusCard.publishing')}
                    </Text>
                    <Text size="sm" c="dimmed">
                      {t('statusCard.hidden')}
                    </Text>
                  </div>
                </Stack>
              </FormCard>

              <FormCard
                title={t('organization')}
                icon={Building}
                iconColor="teal"
              >
                <Stack gap="md">
                  <Controller
                    control={control}
                    name="brandId"
                    render={({ field, fieldState }) => (
                      <RelationInput
                        queryKey={DATA_ACCESS_KEYS.admin.brands.lookup}
                        fetchOptions={brandLookupFetcher}
                        value={field.value ?? null}
                        onChange={field.onChange}
                        clearable
                        label={t('brand.label')}
                        placeholder={t('brand.placeholder')}
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name="categories"
                    render={({ field, fieldState }) => (
                      <RelationInput
                        queryKey={DATA_ACCESS_KEYS.admin.categories.lookup}
                        fetchOptions={categoryLookupFetcher}
                        multiple
                        value={field?.value?.map((c) => c.categoryId) || []}
                        onChange={(ids) =>
                          field.onChange(
                            ids.map((id, i) => ({
                              categoryId: id,
                              sortOrder: i,
                            }))
                          )
                        }
                        label={t('categories.label')}
                        placeholder={t('categories.placeholder')}
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name="tagIds"
                    render={({ field, fieldState }) => (
                      <RelationInput
                        queryKey={DATA_ACCESS_KEYS.admin.tags.lookup}
                        fetchOptions={tagLookupFetcher}
                        multiple
                        value={field?.value || []}
                        onChange={field.onChange}
                        label={t('tags.label')}
                        placeholder={t('tags.placeholder')}
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </Stack>
              </FormCard>
            </Stack>
          </Group>
        </Stack>
      </form>
    </FormProvider>
  );
};

export default AdminProductPage;
