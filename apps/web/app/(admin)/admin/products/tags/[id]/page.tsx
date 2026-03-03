'use client';

import {
  useAdminTagGroup,
  useSaveTagGroup,
} from '@/core/hooks/useAdminTagGroup';
import { useTranslatedZodResolver } from '@/core/hooks/useTranslatedZodResolver';
import { Button, Group, Stack, Text, TextInput, Textarea } from '@mantine/core';
import {
  NEW_TAG_GROUP_DEFAULT_VALUES,
  TagGroupSchema,
  type TagGroupInput,
  type TagGroupOutput,
} from '@org/schemas/admin/tags';
import { FormCard } from '@org/ui/common/form-card';
import LoadingOverlay from '@org/ui/common/loading-overlay';
import { createId } from '@paralleldrive/cuid2';
import { FileText, Save, SendToBack } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useRef } from 'react';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { TagTreeTable } from './components/TagTreeTable';

const AdminTagGroupFormPage = () => {
  const t = useTranslations('frontend.admin.tags.form');
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const isNew = id === 'new';
  const { data, isLoading } = useAdminTagGroup(id);
  const saveTagGroup = useSaveTagGroup();
  const saveAsDraftRef = useRef(false);

  const formattedData = useMemo<TagGroupInput>(() => {
    if (!data || isNew) {
      return { ...NEW_TAG_GROUP_DEFAULT_VALUES, id: createId() };
    }

    return {
      id: data.id,
      slug: data.slug,
      isActive: data.isActive,
      sortOrder: data.sortOrder,
      translations: data.translations.map((tr) => ({
        locale: tr.locale,
        name: tr.name,
        description: tr.description ?? '',
      })),
      tags: [],
    };
  }, [data, isNew]);

  const resolver = useTranslatedZodResolver(TagGroupSchema);
  const methods = useForm<TagGroupInput>({
    resolver,
    defaultValues: NEW_TAG_GROUP_DEFAULT_VALUES,
    values: formattedData,
  });

  const {
    control,
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = methods;

  const tagGroupName = watch('translations.0.name');

  const onSubmit = async (formData: TagGroupInput) => {
    const payload = {
      ...formData,
      isActive: !saveAsDraftRef.current,
    } as unknown as TagGroupOutput;

    await saveTagGroup.mutateAsync(payload);

    if (isNew) {
      router.push(`/admin/products/tags/${formData.id}`);
    } else {
      router.push('/admin/products/tags');
    }
  };

  const handleSaveAsDraft = () => {
    saveAsDraftRef.current = true;
    handleSubmit(onSubmit)();
  };

  const handleSave = () => {
    saveAsDraftRef.current = false;
    handleSubmit(onSubmit)();
  };

  if (isLoading && !isNew) return <LoadingOverlay />;

  return (
    <FormProvider {...methods}>
      <Stack gap="lg">
        <div>
          <Group justify="space-between" align="center">
            <Text size="xl" fw={700} lh={1.2}>
              {tagGroupName || (isNew ? t('newTagGroup') : '—')}
            </Text>
            <Group gap="sm">
              <Button
                variant="default"
                onClick={() => router.push('/admin/products/tags')}
              >
                {t('discard')}
              </Button>
              <Button
                variant="light"
                leftSection={<SendToBack size={16} />}
                loading={isSubmitting && saveAsDraftRef.current}
                onClick={handleSaveAsDraft}
              >
                {t('saveAsDraft')}
              </Button>
              <Button
                leftSection={<Save size={16} />}
                loading={isSubmitting && !saveAsDraftRef.current}
                onClick={handleSave}
              >
                {t('save')}
              </Button>
            </Group>
          </Group>
        </div>

        <Stack gap="md">
          <FormCard title={t('generalInfo')} icon={FileText} iconColor="blue">
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

          <TagTreeTable tagGroupId={id} isNew={isNew} />
        </Stack>
      </Stack>
    </FormProvider>
  );
};

export default AdminTagGroupFormPage;
