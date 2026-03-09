'use client';

import {
  brandLookupFetcher,
  categoryTreeFetcher,
  tagTreeFetcher,
  taxonomyTreeFetcher,
} from '@/core/hooks/useAdminLookup';
import { useAdminProduct, useSaveProduct } from '@/core/hooks/useAdminProducts';
import { useAdminStores } from '@/core/hooks/useAdminStores';
import { useImageUpload } from '@/core/hooks/useImageUpload';
import { useTranslatedZodResolver } from '@/core/hooks/useTranslatedZodResolver';
import { ApiError } from '@/core/lib/api/api-error';
import {
  Alert,
  Button,
  Divider,
  Group,
  Select,
  Stack,
  Text,
  TextInput,
  Textarea,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
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
  ProductSchema,
  type ProductInputType,
  type ProductOutputType,
} from '@org/schemas/admin/products';
import type { VariantGroupInput } from '@org/schemas/admin/variants';
import { FormCard } from '@org/ui/common/form-card';
import LoadingOverlay from '@org/ui/common/loading-overlay';
import { Dropzone, type RemoteFile } from '@org/ui/dropzone';
import { ProductSeoCard } from '@org/ui/inputs/product-seo-card';
import { RelationDrawer } from '@org/ui/inputs/relation-drawer';
import { RichTextEditor } from '@org/ui/inputs/rich-text-editor';
import { StoreMultiSelect } from '@org/ui/inputs/store-multi-select';
import { createId } from '@paralleldrive/cuid2';
import {
  Activity,
  Building,
  FileText,
  Image as ImageIcon,
  Save,
  Store,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import {
  Controller,
  FormProvider,
  SubmitHandler,
  useForm,
} from 'react-hook-form';
import { VariantCreator } from './components/VariantCreator';

const AdminProductPage = () => {
  const t = useTranslations('frontend.admin.products.form');
  const tEnums = useTranslations('frontend.enums');
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const isNew = id === 'new';
  const { data, isLoading, isError, error } = useAdminProduct(id);
  const {
    data: stores = [],
    isLoading: storesLoading,
    isPending: storesPending,
  } = useAdminStores();
  const apiError = error as ApiError | null;
  const isMobile = useMediaQuery('(max-width: 768px)');

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
      variantGroups: (() => {
        const usedOptionIds = new Set(
          (data.variants ?? []).flatMap((v) =>
            v.optionValues.map((ov) => ov.variantOption.id)
          )
        );
        return (
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
            options: pvg.variantGroup.options
              .filter((opt) => usedOptionIds.has(opt.id))
              .map((opt) => ({
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
          })) ?? []
        );
      })(),
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
      activeStores: data.stores?.map((s) => s.store.id) ?? [],
      googleTaxonomyId: data.googleTaxonomyId ?? null,
      uniqueId: data.id,
    };
  }, [data, isNew]);

  const initialOriginalOptionsMap = useMemo(() => {
    if (!data || isNew) return undefined;
    const map = new Map<string, VariantGroupInput['options']>();
    for (const pvg of data.variantGroups ?? []) {
      map.set(
        pvg.variantGroup.id,
        pvg.variantGroup.options.map((opt) => ({
          uniqueId: opt.id,
          colorCode: opt.colorCode ?? '',
          sortOrder: opt.sortOrder,
          translations: opt.translations.map((tr) => ({
            locale:
              tr.locale as VariantGroupInput['options'][number]['translations'][number]['locale'],
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
        }))
      );
    }
    return map;
  }, [data, isNew]);

  const productId = useMemo(() => {
    if (!isNew && data?.id) return data.id;
    return createId();
  }, [data, isNew]);

  const [existingFiles, setExistingFiles] = useState<RemoteFile[]>([]);

  const initialExisting = useMemo<RemoteFile[]>(() => {
    if (!data || isNew) return [];
    return (
      data.images?.map((img) => ({
        id: img.id,
        url: img.url,
        fileType: img.fileType,
        order: img.sortOrder,
      })) ?? []
    );
  }, [data, isNew]);

  useMemo(() => {
    setExistingFiles(initialExisting);
  }, [initialExisting]);

  const { deletingIds, isUploading, deleteImage, uploadFiles } = useImageUpload(
    {
      basePath: `/admin/products/${productId}/images`,
      onDeleteError: () => {
        notifications.show({
          color: 'red',
          title: t('loadError'),
          message: t('loadErrorDescription'),
        });
      },
      onUploadError: () => {
        notifications.show({
          color: 'red',
          title: t('loadError'),
          message: t('loadErrorDescription'),
        });
      },
    }
  );

  const saveProduct = useSaveProduct();

  const handleRemoveExisting = useCallback(
    async (file: RemoteFile) => {
      const ok = await deleteImage(file);
      if (ok) {
        setExistingFiles((prev) => prev.filter((f) => f.id !== file.id));
      }
    },
    [deleteImage]
  );

  const resolver = useTranslatedZodResolver(ProductSchema);
  const methods = useForm<ProductInputType>({
    resolver,
    defaultValues: NEW_PRODUCT_DEFAULT_VALUES,
    values: formattedData,
  });

  const {
    control,
    handleSubmit,
    watch,
    formState: { isSubmitting, errors },
  } = methods;

  const productName = watch('translations.0.name');

  const onSubmit: SubmitHandler<ProductInputType> = async (formData) => {
    try {
      if (isNew) {
        const initialSave = {
          ...formData,
          uniqueId: productId,
          newImages: undefined,
          existingImages: [],
          variants: (formData.variants ?? []).map((v) => ({
            ...v,
            newImages: undefined,
            existingImages: [],
          })),
          variantGroups: (formData.variantGroups ?? []).map((g) => ({
            ...g,
            options: g.options.map((o) => ({
              ...o,
              images: undefined,
            })),
          })),
        };
        await saveProduct.mutateAsync(
          initialSave as unknown as ProductOutputType
        );
      }

      const productNewImages = formData.newImages ?? [];
      let productUploadResults: Array<{
        imageId: string;
        url: string;
        fileType: string;
      }> = [];
      if (productNewImages.length > 0) {
        productUploadResults = await uploadFiles(productNewImages, {
          ownerType: 'product',
          ownerId: productId,
        });
      }
      const productExistingImages = [
        ...existingFiles.map((f, i) => ({
          id: f.id,
          url: f.url,
          fileType: f.fileType,
          sortOrder: i,
        })),
        ...productUploadResults.map((r, i) => ({
          id: r.imageId,
          url: r.url,
          fileType: r.fileType,
          sortOrder: existingFiles.length + i,
        })),
      ];

      const processedVariants = [];
      for (const variant of formData.variants ?? []) {
        const newImgs = variant.newImages ?? [];
        let variantUploadResults: Array<{
          imageId: string;
          url: string;
          fileType: string;
        }> = [];
        if (newImgs.length > 0) {
          variantUploadResults = await uploadFiles(newImgs, {
            ownerType: 'productVariant',
            ownerId: variant.uniqueId,
          });
        }
        processedVariants.push({
          ...variant,
          newImages: undefined,
          existingImages: [
            ...(variant.existingImages ?? []).map((img, i) => ({
              id: img.id,
              url: img.url,
              fileType: img.fileType,
              sortOrder: i,
            })),
            ...variantUploadResults.map((r, i) => ({
              id: r.imageId,
              url: r.url,
              fileType: r.fileType,
              sortOrder: (variant.existingImages?.length ?? 0) + i,
            })),
          ],
        });
      }

      const optionsWithNewImages: Array<{
        groupUniqueId: string;
        optUniqueId: string;
        files: NonNullable<
          ProductInputType['variantGroups']
        >[number]['options'][number]['images'];
        currentExistingCount: number;
      }> = [];

      const processedVariantGroups = (formData.variantGroups ?? []).map(
        (group) => ({
          ...group,
          options: group.options.map((opt) => {
            const newImgs = opt.images ?? [];
            if (newImgs.length > 0) {
              optionsWithNewImages.push({
                groupUniqueId: group.uniqueId,
                optUniqueId: opt.uniqueId,
                files: newImgs,
                currentExistingCount: opt.existingImages?.length ?? 0,
              });
            }
            return { ...opt, images: undefined };
          }),
        })
      );

      const saveData = {
        ...formData,
        uniqueId: productId,
        newImages: undefined,
        existingImages: productExistingImages,
        variants: processedVariants,
        variantGroups: processedVariantGroups,
      };
      const savedProduct = await saveProduct.mutateAsync(
        saveData as unknown as ProductOutputType
      );

      if (optionsWithNewImages.length > 0) {
        const updatedGroups = processedVariantGroups.map((g) => ({
          ...g,
          options: g.options.map((o) => ({ ...o })),
        }));

        for (const item of optionsWithNewImages) {
          const savedPvg = savedProduct.variantGroups?.find(
            (pvg) => pvg.variantGroup.id === item.groupUniqueId
          );
          const pvgOpt = savedPvg?.options?.find(
            (o) => o.variantOptionId === item.optUniqueId
          );
          if (!pvgOpt || !item.files || item.files.length === 0) continue;

          const results = await uploadFiles(item.files, {
            ownerType: 'productVariantGroupOption',
            ownerId: pvgOpt.id,
          });

          const groupIdx = updatedGroups.findIndex(
            (g) => g.uniqueId === item.groupUniqueId
          );
          if (groupIdx >= 0) {
            const optIdx = updatedGroups[groupIdx].options.findIndex(
              (o) => o.uniqueId === item.optUniqueId
            );
            if (optIdx >= 0) {
              updatedGroups[groupIdx].options[optIdx] = {
                ...updatedGroups[groupIdx].options[optIdx],
                existingImages: [
                  ...(updatedGroups[groupIdx].options[optIdx].existingImages ??
                    []),
                  ...results.map((r, i) => ({
                    id: r.imageId,
                    url: r.url,
                    fileType: r.fileType,
                    sortOrder: item.currentExistingCount + i,
                  })),
                ],
              };
            }
          }
        }

        await saveProduct.mutateAsync({
          ...saveData,
          variantGroups: updatedGroups,
        } as unknown as ProductOutputType);
      }

      router.push('/admin/products');
    } catch (err) {
      const apiErr = err as ApiError;
      notifications.show({
        color: 'red',
        title: t('loadError'),
        message: apiErr?.message ?? t('loadErrorDescription'),
      });
    }
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
          onClick={() => router.push('/admin/products')}
        >
          {t('backToProducts')}
        </Button>
      </Stack>
    );
  }

  const statusOptions = buildEnumOptions(ProductStatusConfigs, tEnums);
  const typeOptions = buildEnumOptions(ProductTypeConfigs, tEnums);

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
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
              <VariantCreator
                isNew={isNew}
                initialOriginalOptionsMap={initialOriginalOptionsMap}
                deleteImage={deleteImage}
                deletingIds={deletingIds}
              />

              <FormCard
                title={t('media.title')}
                description={t('media.description')}
                icon={ImageIcon}
                iconColor="grape"
              >
                <Controller
                  control={control}
                  name="newImages"
                  render={({ field, fieldState }) => (
                    <Stack gap="xs">
                      <Dropzone
                        value={field.value}
                        onChange={field.onChange}
                        accept={getMimePatterns([
                          FileType.IMAGE,
                          FileType.VIDEO,
                        ])}
                        maxSize={5 * 1024 * 1024}
                        multiple
                        maxFiles={10}
                        existingFiles={existingFiles}
                        onRemoveExisting={handleRemoveExisting}
                        onReorderExisting={setExistingFiles}
                        deletingIds={deletingIds}
                        loading={isUploading}
                      />
                      {fieldState.error?.message && (
                        <Text size="xs" c="red">
                          {fieldState.error.message}
                        </Text>
                      )}
                    </Stack>
                  )}
                />
              </FormCard>

              <ProductSeoCard
                locale="TR"
                slugName="translations.0.slug"
                nameName="translations.0.name"
                metaTitleName="translations.0.metaTitle"
                metaDescriptionName="translations.0.metaDescription"
                defaultValue={{ slug: data?.translations?.[0]?.slug ?? '' }}
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
                      <RelationDrawer
                        queryKey={DATA_ACCESS_KEYS.admin.brands.lookup}
                        fetchOptions={brandLookupFetcher}
                        title={t('brand.label')}
                        label={t('brand.label')}
                        placeholder={t('brand.placeholder')}
                        value={field.value ?? null}
                        onChange={field.onChange}
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name="categories"
                    render={({ field, fieldState }) => (
                      <RelationDrawer
                        queryKey={DATA_ACCESS_KEYS.admin.categories.lookup}
                        fetchOptions={categoryTreeFetcher}
                        multiple
                        tree
                        title={t('categories.label')}
                        label={t('categories.label')}
                        placeholder={t('categories.placeholder')}
                        value={field?.value?.map((c) => c.categoryId) || []}
                        onChange={(ids) =>
                          field.onChange(
                            ids.map((id, i) => ({
                              categoryId: id,
                              sortOrder: i,
                            }))
                          )
                        }
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name="tagIds"
                    render={({ field, fieldState }) => (
                      <RelationDrawer
                        queryKey={DATA_ACCESS_KEYS.admin.tags.lookup}
                        fetchOptions={tagTreeFetcher}
                        multiple
                        tree
                        title={t('tags.label')}
                        label={t('tags.label')}
                        placeholder={t('tags.placeholder')}
                        value={field?.value || []}
                        onChange={field.onChange}
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name="googleTaxonomyId"
                    render={({ field, fieldState }) => (
                      <RelationDrawer
                        queryKey={DATA_ACCESS_KEYS.admin.taxonomy.tree}
                        fetchOptions={taxonomyTreeFetcher}
                        tree
                        title={t('taxonomy.label')}
                        label={t('taxonomy.label')}
                        placeholder={t('taxonomy.placeholder')}
                        value={field.value != null ? String(field.value) : null}
                        onChange={(id) =>
                          field.onChange(id != null ? Number(id) : null)
                        }
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </Stack>
              </FormCard>

              <FormCard
                title={t('salesChannels.title')}
                icon={Store}
                iconColor="violet"
              >
                <Controller
                  control={control}
                  name="activeStores"
                  render={({ field, fieldState }) => (
                    <StoreMultiSelect
                      stores={stores}
                      value={field.value ?? []}
                      onChange={field.onChange}
                      placeholder={t('salesChannels.placeholder')}
                      error={fieldState.error?.message}
                      isLoading={storesPending}
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

export default AdminProductPage;
