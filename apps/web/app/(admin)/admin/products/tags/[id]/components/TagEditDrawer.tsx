'use client';

import { useSaveTag } from '@/core/hooks/useAdminTagGroup';
import { useTranslatedZodResolver } from '@/core/hooks/useTranslatedZodResolver';
import {
  Button,
  Drawer,
  Group,
  NumberInput,
  Stack,
  Switch,
  Text,
  TextInput,
  type DrawerProps,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { getMimePatterns } from '@org/constants/product-constants';
import { FileType } from '@org/prisma/browser';
import {
  BaseTagSchema,
  type BaseTagInput,
  type BaseTagOutput,
  type RecursiveTagInput,
  type TagGroupInput,
} from '@org/schemas/admin/tags';
import type { AdminTagChildrenPrismaType } from '@org/types/admin/tags';
import { Dropzone } from '@org/ui/dropzone';
import { createId } from '@paralleldrive/cuid2';
import { useTranslations } from 'next-intl';
import { slugify } from '@org/utils';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm, useFormContext } from 'react-hook-form';
import { addTagToTree, updateTagInTree } from '../utils/tag-tree-helpers';

interface TagEditDrawerProps extends Omit<DrawerProps, 'title'> {
  tag: AdminTagChildrenPrismaType | null;
  parentTagId: string | null;
  tagGroupId: string;
  isNew: boolean;
}

function mapPrismaTagToFormInput(
  tag: AdminTagChildrenPrismaType
): BaseTagInput {
  return {
    id: tag.id,
    slug: tag.slug,
    parentTagId: tag.parentTagId ?? null,
    isActive: tag.isActive,
    sortOrder: tag.sortOrder,
    translations: tag.translations.map((tr) => ({
      locale: tr.locale,
      name: tr.name,
      description: tr.description ?? '',
    })),
    existingImages: tag.images.map((img) => ({
      id: img.id,
      url: img.url,
      fileType: img.fileType,
      sortOrder: img.sortOrder,
    })),
    images: [],
  };
}

export const TagEditDrawer = ({
  tag,
  parentTagId,
  tagGroupId,
  isNew,
  ...drawerProps
}: TagEditDrawerProps) => {
  const t = useTranslations('frontend.admin.tags.form.tags');
  const tForm = useTranslations('frontend.admin.tags.form');
  const saveTag = useSaveTag(tagGroupId, {
    onSuccess: () =>
      notifications.show({ color: 'green', message: tForm('tagSaveSuccess') }),
    onError: (err) =>
      notifications.show({
        color: 'red',
        title: tForm('tagSaveError'),
        message: err?.message,
      }),
  });
  const resolver = useTranslatedZodResolver(BaseTagSchema);
  const parentForm = useFormContext<TagGroupInput>();

  const draftForm = useForm<BaseTagInput>({
    resolver,
    defaultValues: {
      id: '',
      slug: '',
      parentTagId: null,
      isActive: true,
      sortOrder: 0,
      translations: [{ locale: 'TR', name: '', description: '' }],
      existingImages: [],
      images: [],
    },
  });

  const {
    control,
    reset,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting },
  } = draftForm;

  const tagName = watch('translations.0.name');
  const [userEditedSlug, setUserEditedSlug] = useState(false);

  useEffect(() => {
    if (userEditedSlug) return;
    if (!tagName) return;
    setValue('slug', slugify(tagName, 'tr'), { shouldValidate: true });
  }, [tagName, userEditedSlug, setValue]);

  const prevOpenedRef = useRef(false);

  useEffect(() => {
    if (drawerProps.opened && !prevOpenedRef.current) {
      if (tag) {
        reset(mapPrismaTagToFormInput(tag));
        setUserEditedSlug(true);
      } else {
        reset({
          id: createId(),
          slug: '',
          parentTagId: parentTagId,
          isActive: true,
          sortOrder: 0,
          translations: [{ locale: 'TR', name: '', description: '' }],
          existingImages: [],
          images: [],
        });
        setUserEditedSlug(false);
      }
    }
    prevOpenedRef.current = drawerProps.opened ?? false;
  }, [drawerProps.opened, tag, parentTagId, reset]);

  const onSubmit = async (data: BaseTagInput) => {
    if (isNew) {
      const newTag: RecursiveTagInput = {
        id: data.id,
        slug: data.slug,
        parentTagId: data.parentTagId ?? null,
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder ?? 0,
        translations: data.translations,
        existingImages: (data.existingImages ?? []).map((img) => ({
          ...img,
          sortOrder: img.sortOrder ?? 0,
        })),
        images: [],
        children: [],
      };

      const currentTags = (parentForm.getValues('tags') ??
        []) as RecursiveTagInput[];
      const isEditing = tag !== null;

      const updatedTags = isEditing
        ? updateTagInTree(currentTags, newTag)
        : addTagToTree(currentTags, newTag, data.parentTagId ?? null);

      parentForm.setValue('tags', updatedTags);
      drawerProps.onClose();
    } else {
      try {
        await saveTag.mutateAsync(data as unknown as BaseTagOutput);
        drawerProps.onClose();
      } catch {
        // handled by useSaveTag onError callback
      }
    }
  };

  return (
    <Drawer
      {...drawerProps}
      title={
        <Text fw={600} size="md">
          {tag ? t('editDrawer.editTitle') : t('editDrawer.newTitle')}
        </Text>
      }
      position="right"
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack gap="md">
          <Controller
            control={control}
            name="translations.0.name"
            render={({ field, fieldState }) => (
              <TextInput
                {...field}
                value={field.value ?? ''}
                label={t('tagName.label')}
                placeholder={t('tagName.placeholder')}
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
                value={field.value ?? ''}
                onChange={(e) => {
                  field.onChange(e);
                  setUserEditedSlug(true);
                }}
                label={t('slug')}
                placeholder="tag-slug"
                error={fieldState.error?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="translations.0.description"
            render={({ field, fieldState }) => (
              <TextInput
                {...field}
                value={field.value ?? ''}
                label={t('tagDescription.label')}
                placeholder={t('tagDescription.placeholder')}
                error={fieldState.error?.message}
              />
            )}
          />

          <Group gap="md">
            <Controller
              control={control}
              name="isActive"
              render={({ field }) => (
                <Switch
                  checked={!!field.value}
                  onChange={field.onChange}
                  label={t('activeLabel')}
                />
              )}
            />
            <Controller
              control={control}
              name="sortOrder"
              render={({ field, fieldState }) => (
                <NumberInput
                  {...field}
                  value={field.value ?? 0}
                  label={t('sortOrder')}
                  min={0}
                  style={{ width: 100 }}
                  error={fieldState.error?.message}
                />
              )}
            />
          </Group>

          {!isNew && (
            <Controller
              control={control}
              name="images"
              render={({ field }) => (
                <Dropzone
                  value={field.value ?? []}
                  onChange={field.onChange}
                  accept={getMimePatterns([FileType.IMAGE])}
                  maxSize={5 * 1024 * 1024}
                  multiple
                  maxFiles={3}
                />
              )}
            />
          )}
          {isNew && (
            <Text size="xs" c="dimmed">
              {t('editDrawer.imagesAfterSave')}
            </Text>
          )}

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={drawerProps.onClose}>
              {t('editDrawer.cancel')}
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {t('editDrawer.save')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Drawer>
  );
};
