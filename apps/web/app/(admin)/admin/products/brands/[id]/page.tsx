'use client';

import { useAdminBrand, useSaveBrand } from '@/core/hooks/useAdminBrands';
import { useImageUpload } from '@/core/hooks/useImageUpload';
import { useTranslatedZodResolver } from '@/core/hooks/useTranslatedZodResolver';
import { ApiError } from '@/core/lib/api/api-error';
import {
  Alert,
  Button,
  Divider,
  Group,
  NumberInput,
  Stack,
  Switch,
  Text,
  TextInput,
  Textarea,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { getMimePatterns } from '@org/constants/product-constants';
import { FileType } from '@org/prisma/browser';
import {
  BrandInput,
  BrandOutput,
  BrandSchema,
  NEW_BRAND_DEFAULT_VALUES,
} from '@org/schemas/admin/brands';
import { FormCard } from '@org/ui/common/form-card';
import LoadingOverlay from '@org/ui/common/loading-overlay';
import { Dropzone, type RemoteFile } from '@org/ui/dropzone';
import { createId } from '@paralleldrive/cuid2';
import { Activity, FileText, Image as ImageIcon, Save } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { slugify } from '@org/utils';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Controller,
  FormProvider,
  SubmitHandler,
  useForm,
} from 'react-hook-form';

const AdminBrandFormPage = () => {
  const t = useTranslations('frontend.admin.brands.form');
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const isNew = id === 'new';
  const { data, isLoading, isError, error } = useAdminBrand(id);
  const apiError = error as ApiError | null;
  const saveBrand = useSaveBrand({
    onSuccess: () =>
      notifications.show({ color: 'green', message: t('saveSuccess') }),
    onError: (err) =>
      notifications.show({
        color: 'red',
        title: t('loadError'),
        message: err?.message ?? t('loadErrorDescription'),
      }),
  });
  const isMobile = useMediaQuery('(max-width: 768px)');

  const brandId = useMemo(() => {
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
      basePath: `/admin/brands/${brandId}/images`,
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

  const handleRemoveExisting = useCallback(
    async (file: RemoteFile) => {
      const ok = await deleteImage(file);
      if (ok) {
        setExistingFiles((prev) => prev.filter((f) => f.id !== file.id));
      }
    },
    [deleteImage]
  );

  const formattedData = useMemo<BrandInput>(() => {
    if (!data || isNew) {
      return { ...NEW_BRAND_DEFAULT_VALUES, id: brandId };
    }

    return {
      id: data.id,
      slug: data.slug,
      websiteUrl: data.websiteUrl ?? '',
      isActive: data.isActive,
      sortOrder: data.sortOrder,
      translations: data.translations.map((tr) => ({
        locale: tr.locale,
        name: tr.name,
        description: tr.description ?? '',
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
  }, [data, isNew, brandId]);

  const resolver = useTranslatedZodResolver(BrandSchema);
  const methods = useForm<BrandInput>({
    resolver,
    defaultValues: NEW_BRAND_DEFAULT_VALUES,
    values: formattedData,
  });

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting },
  } = methods;

  const brandName = watch('translations.0.name');
  const [userEditedSlug, setUserEditedSlug] = useState(() => !!(data?.slug));

  useEffect(() => {
    setUserEditedSlug(!!(data?.slug));
  }, [data?.slug]);

  useEffect(() => {
    if (userEditedSlug) return;
    if (!brandName) return;
    setValue('slug', slugify(brandName, 'tr'), { shouldValidate: true });
  }, [brandName, userEditedSlug, setValue]);

  const onSubmit: SubmitHandler<BrandInput> = async (formData) => {
    try {
      const newImages = formData.images ?? [];

      // 1. Yeni image'leri yükle — sonuçları al
      let uploadResults: { imageId: string; url: string; fileType: string }[] =
        [];
      if (newImages.length > 0) {
        uploadResults = await uploadFiles(newImages);
      }

      // 2. existingFiles + upload sonuçlarını birleştir
      const allExisting = [
        ...existingFiles.map((f, i) => ({
          id: f.id,
          url: f.url,
          fileType: f.fileType,
          sortOrder: i,
        })),
        ...uploadResults.map((r, i) => ({
          id: r.imageId,
          url: r.url,
          fileType: r.fileType,
          sortOrder: existingFiles.length + i,
        })),
      ];

      // 3. Brand'i kaydet (images olmadan, sadece existingImages)
      const saveData = {
        ...formData,
        id: brandId,
        images: undefined,
        existingImages: allExisting,
      };

      await saveBrand.mutateAsync(saveData as unknown as BrandOutput);
      router.push('/admin/products/brands');
    } catch {
      // handled by useSaveBrand onError callback
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
          onClick={() => router.push('/admin/products/brands')}
        >
          {t('backToBrands')}
        </Button>
      </Stack>
    );
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack gap="lg">
          <div>
            <Group justify="space-between" align="center">
              <Text size="xl" fw={700} lh={1.2}>
                {brandName || (isNew ? t('newBrand') : '—')}
              </Text>
              <Group gap="sm">
                <Button
                  variant="default"
                  onClick={() => router.push('/admin/products/brands')}
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
                    name="slug"
                    render={({ field, fieldState }) => (
                      <TextInput
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          setUserEditedSlug(true);
                        }}
                        label={t('slug.label')}
                        placeholder={t('slug.placeholder')}
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name="websiteUrl"
                    render={({ field, fieldState }) => (
                      <TextInput
                        {...field}
                        value={field.value ?? ''}
                        label={t('website.label')}
                        placeholder={t('website.placeholder')}
                        error={fieldState.error?.message}
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
                  render={({ field, fieldState }) => (
                    <Stack gap="xs">
                      <Dropzone
                        value={field.value}
                        onChange={field.onChange}
                        accept={getMimePatterns([FileType.IMAGE])}
                        maxSize={5 * 1024 * 1024}
                        multiple
                        maxFiles={3}
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
                    name="isActive"
                    render={({ field }) => (
                      <Switch
                        checked={field.value}
                        onChange={field.onChange}
                        label={t('statusCard.activeLabel')}
                      />
                    )}
                  />
                  <Divider />
                  <Controller
                    control={control}
                    name="sortOrder"
                    render={({ field, fieldState }) => (
                      <NumberInput
                        {...field}
                        label={t('sortOrder.label')}
                        min={0}
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

export default AdminBrandFormPage;
