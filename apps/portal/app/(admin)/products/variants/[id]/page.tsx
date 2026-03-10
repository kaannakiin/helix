'use client';

import {
  useAdminVariantGroup,
  useSaveVariantGroup,
} from '@/core/hooks/useAdminVariantGroup';
import { apiClient } from '@/core/lib/api/api-client';
import { ApiError } from '@/core/lib/api/api-error';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ActionIcon,
  Alert,
  Avatar,
  Badge,
  Button,
  ColorInput,
  ColorSwatch,
  Group,
  NumberInput,
  Radio,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { getMimePatterns } from '@org/constants/product-constants';
import { useTranslatedZodResolver } from '@org/hooks/useTranslatedZodResolver';
import { FileType, VariantGroupType } from '@org/prisma/browser';
import {
  NEW_VARIANT_GROUP_DEFAULT_VALUES,
  VariantGroupSchema,
  type VariantGroupInput,
  type VariantGroupOutput,
} from '@org/schemas/admin/variants';
import { FormCard } from '@org/ui/common/form-card';
import LoadingOverlay from '@org/ui/common/loading-overlay';
import { Dropzone } from '@org/ui/dropzone';
import { slugify } from '@org/utils/slugify';
import { createId } from '@paralleldrive/cuid2';
import {
  Activity,
  FileText,
  GripVertical,
  List,
  Plus,
  Save,
  X,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
  Controller,
  FormProvider,
  useFieldArray,
  useForm,
  type SubmitHandler,
} from 'react-hook-form';

type VariantOptionItem = VariantGroupInput['options'][number];

interface SortableOptionRowProps {
  opt: VariantOptionItem;
  isColor: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onRemove: () => void;
  unnamedLabel: string;
  error?: string;
}

const SortableOptionRow = ({
  opt,
  isColor,
  isExpanded,
  onToggleExpand,
  onRemove,
  unnamedLabel,
  error,
}: SortableOptionRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: opt.uniqueId });

  const optionName = opt.translations?.[0]?.name || unnamedLabel;
  const hasImage = (opt.existingImages?.length ?? 0) > 0;
  const imageUrl = opt.existingImages?.[0]?.url;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <Group
        wrap="nowrap"
        gap="sm"
        onClick={onToggleExpand}
        style={(theme) => ({
          borderRadius: theme.radius.sm,
          border: `1px solid ${
            error
              ? theme.colors.red[5]
              : isExpanded
              ? theme.colors.blue[4]
              : theme.colors.gray[2]
          }`,
          padding: `6px ${theme.spacing.sm}`,
          backgroundColor: isExpanded ? theme.colors.blue[0] : theme.white,
          cursor: 'pointer',
        })}
      >
        <ActionIcon
          variant="subtle"
          color="gray"
          size="xs"
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          aria-label="Drag to reorder"
          onClick={(e) => e.stopPropagation()}
          {...attributes}
          {...listeners}
        >
          <GripVertical size={12} />
        </ActionIcon>

        {isColor &&
          (hasImage && imageUrl ? (
            <Avatar src={imageUrl} size={28} radius="sm" />
          ) : opt.colorCode ? (
            <ColorSwatch color={opt.colorCode} size={24} />
          ) : (
            <ColorSwatch color="#cccccc" size={24} />
          ))}

        <Text size="sm" fw={500} style={{ flex: 1, minWidth: 0 }} lineClamp={1}>
          {optionName}
        </Text>

        <ActionIcon
          variant="subtle"
          color="red"
          size="xs"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <X size={12} />
        </ActionIcon>
      </Group>
      {error && (
        <Text size="xs" c="red" mt={4}>
          {error}
        </Text>
      )}
    </div>
  );
};

const AdminVariantGroupFormPage = () => {
  const t = useTranslations('frontend.admin.variants.form');
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const id = params.id as string;
  const isNew = id === 'new';
  const { data, isLoading, isError, error } = useAdminVariantGroup(id);
  const apiError = error as ApiError | null;
  const saveVariantGroup = useSaveVariantGroup({
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

  const [expandedOptionId, setExpandedOptionId] = useState<string | null>(null);

  const formattedData = useMemo<VariantGroupInput>(() => {
    if (!data || isNew) {
      return { ...NEW_VARIANT_GROUP_DEFAULT_VALUES, uniqueId: createId() };
    }

    return {
      uniqueId: data.id,
      type: data.type,
      sortOrder: data.sortOrder,
      translations: data.translations.map((tr) => ({
        locale: tr.locale,
        name: tr.name,
        slug: tr.slug ?? '',
      })),
      options: data.options.map((opt) => ({
        uniqueId: opt.id,
        colorCode: opt.colorCode ?? undefined,
        sortOrder: opt.sortOrder,
        translations: opt.translations.map((tr) => ({
          locale: tr.locale,
          name: tr.name,
          slug: tr.slug ?? '',
        })),
        images: [],
        existingImages:
          opt.images?.map((img) => ({
            id: img.id,
            url: img.url,
            fileType: img.fileType,
            sortOrder: img.sortOrder,
          })) ?? [],
      })),
    };
  }, [data, isNew]);

  const resolver = useTranslatedZodResolver(VariantGroupSchema);
  const methods = useForm<VariantGroupInput>({
    resolver,
    defaultValues: NEW_VARIANT_GROUP_DEFAULT_VALUES,
    values: formattedData,
  });

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting, errors },
  } = methods;

  const groupName = watch('translations.0.name');
  const groupType = watch('type');
  const isColor = groupType === VariantGroupType.COLOR;

  const {
    fields: optionFields,
    append: appendOption,
    remove: removeOption,
    move: moveOption,
  } = useFieldArray({
    control,
    name: 'options',
    keyName: '_key',
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const currentOptions = watch('options');

  const handleOptionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = optionFields.findIndex(
      (o) => o.uniqueId === String(active.id)
    );
    const newIndex = optionFields.findIndex(
      (o) => o.uniqueId === String(over.id)
    );
    if (oldIndex === -1 || newIndex === -1) return;

    moveOption(oldIndex, newIndex);

    const reordered =
      oldIndex < newIndex
        ? [
            ...optionFields.slice(0, oldIndex),
            ...optionFields.slice(oldIndex + 1, newIndex + 1),
            optionFields[oldIndex],
            ...optionFields.slice(newIndex + 1),
          ]
        : [
            ...optionFields.slice(0, newIndex),
            optionFields[oldIndex],
            ...optionFields.slice(newIndex, oldIndex),
            ...optionFields.slice(oldIndex + 1),
          ];

    reordered.forEach((_, i) => {
      setValue(`options.${i}.sortOrder`, i, { shouldDirty: true });
    });
  };

  const handleAddOption = () => {
    const newId = createId();
    appendOption({
      uniqueId: newId,
      sortOrder: optionFields.length,
      colorCode: isColor
        ? `#${Math.floor(Math.random() * 0xffffff)
            .toString(16)
            .padStart(6, '0')}`
        : undefined,
      translations: [{ locale: 'TR', name: '', slug: '' }],
      images: undefined,
      existingImages: [],
    });
    setExpandedOptionId(newId);
  };

  const onSubmit: SubmitHandler<VariantGroupInput> = async (formData) => {
    try {
      const result = await saveVariantGroup.mutateAsync(
        formData as unknown as VariantGroupOutput
      );

      for (const option of formData.options) {
        if (option.images && option.images.length > 0) {
          const file = option.images[0].file;
          const formPayload = new FormData();
          formPayload.append('file', file);
          formPayload.append('ownerType', 'variantOption');
          await apiClient.post(
            `/admin/variant-groups/options/${option.uniqueId}/image`,
            formPayload,
            { headers: { 'Content-Type': 'multipart/form-data' } }
          );
        }
      }

      router.push('/products/variants');
    } catch {}
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
          onClick={() => router.push('/products/variants')}
        >
          {t('backToVariants')}
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
                {groupName || (isNew ? t('newVariantGroup') : '—')}
              </Text>
              <Group gap="sm">
                <Button
                  variant="default"
                  onClick={() => router.push('/products/variants')}
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
                        onChange={(e) => {
                          field.onChange(e);
                          setValue(
                            'translations.0.slug',
                            slugify(e.target.value, locale),
                            { shouldDirty: true }
                          );
                        }}
                        label={t('name.label')}
                        placeholder={t('name.placeholder')}
                        error={fieldState.error?.message}
                        required
                      />
                    )}
                  />

                  <Controller
                    control={control}
                    name="type"
                    render={({ field, fieldState }) => (
                      <Radio.Group
                        label={t('type.label')}
                        value={field.value}
                        onChange={(v) => v && field.onChange(v)}
                        error={fieldState.error?.message}
                      >
                        <Stack gap="xs" mt="xs">
                          <Radio.Card
                            value={VariantGroupType.SIZE}
                            p="sm"
                            radius="md"
                            withBorder
                          >
                            <Group wrap="nowrap" align="flex-start">
                              <Radio.Indicator />
                              <Stack gap={4}>
                                <Text fw={500} size="sm">
                                  {t('type.size')}
                                </Text>
                                <Text size="xs" c="dimmed">
                                  {t('type.sizeDescription')}
                                </Text>
                                <Group gap={4} mt={4}>
                                  <Badge size="xs" variant="outline">
                                    S
                                  </Badge>
                                  <Badge size="xs" variant="outline">
                                    M
                                  </Badge>
                                  <Badge size="xs" variant="outline">
                                    L
                                  </Badge>
                                  <Badge size="xs" variant="outline">
                                    XL
                                  </Badge>
                                </Group>
                              </Stack>
                            </Group>
                          </Radio.Card>

                          <Radio.Card
                            value={VariantGroupType.COLOR}
                            p="sm"
                            radius="md"
                            withBorder
                          >
                            <Group wrap="nowrap" align="flex-start">
                              <Radio.Indicator />
                              <Stack gap={4}>
                                <Text fw={500} size="sm">
                                  {t('type.color')}
                                </Text>
                                <Text size="xs" c="dimmed">
                                  {t('type.colorDescription')}
                                </Text>
                                <Group gap={4} mt={4}>
                                  <ColorSwatch color="#ff0000" size={16} />
                                  <ColorSwatch color="#0000ff" size={16} />
                                  <ColorSwatch color="#00ff00" size={16} />
                                  <ColorSwatch color="#000000" size={16} />
                                </Group>
                              </Stack>
                            </Group>
                          </Radio.Card>
                        </Stack>
                      </Radio.Group>
                    )}
                  />
                </Stack>
              </FormCard>

              <FormCard
                title={t('options.title')}
                description={t('options.description')}
                icon={List}
                iconColor="green"
              >
                <Stack gap="sm">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleOptionDragEnd}
                  >
                    <SortableContext
                      items={optionFields.map((o) => o.uniqueId)}
                      strategy={verticalListSortingStrategy}
                    >
                      <Stack gap="xs">
                        {optionFields.length === 0 ? (
                          <Text size="sm" c="dimmed" ta="center" py="md">
                            {t('options.noOptions')}
                          </Text>
                        ) : (
                          optionFields.map((fieldMeta, optIndex) => {
                            const opt = currentOptions?.[optIndex] ?? fieldMeta;
                            const isExpanded =
                              expandedOptionId === opt.uniqueId;

                            return (
                              <Stack key={fieldMeta._key} gap={0}>
                                <SortableOptionRow
                                  opt={opt}
                                  isColor={isColor}
                                  isExpanded={isExpanded}
                                  onToggleExpand={() =>
                                    setExpandedOptionId(
                                      isExpanded ? null : opt.uniqueId
                                    )
                                  }
                                  onRemove={() => {
                                    removeOption(optIndex);
                                    if (isExpanded) setExpandedOptionId(null);
                                  }}
                                  unnamedLabel={t('options.unnamedOption')}
                                  error={
                                    errors.options?.[optIndex]
                                      ?.translations?.[0]?.name?.message
                                  }
                                />

                                {isExpanded && (
                                  <Stack
                                    gap="sm"
                                    p="sm"
                                    mt={-1}
                                    style={(theme) => ({
                                      border: `1px solid ${theme.colors.blue[4]}`,
                                      borderTop: 'none',
                                      borderRadius: `0 0 ${theme.radius.sm} ${theme.radius.sm}`,
                                      backgroundColor: theme.colors.gray[0],
                                    })}
                                  >
                                    <Controller
                                      control={control}
                                      name={`options.${optIndex}.translations.0.name`}
                                      render={({ field, fieldState }) => (
                                        <TextInput
                                          {...field}
                                          onChange={(e) => {
                                            field.onChange(e);
                                            setValue(
                                              `options.${optIndex}.translations.0.slug`,
                                              slugify(e.target.value, locale),
                                              { shouldDirty: true }
                                            );
                                          }}
                                          label={t('options.optionName.label')}
                                          placeholder={t(
                                            'options.optionName.placeholder'
                                          )}
                                          error={fieldState.error?.message}
                                          required
                                        />
                                      )}
                                    />

                                    {isColor && (
                                      <>
                                        <Controller
                                          control={control}
                                          name={`options.${optIndex}.colorCode`}
                                          render={({ field, fieldState }) => (
                                            <ColorInput
                                              label={t(
                                                'options.colorCode.label'
                                              )}
                                              placeholder={t(
                                                'options.colorCode.placeholder'
                                              )}
                                              value={field.value ?? ''}
                                              onChange={field.onChange}
                                              error={fieldState.error?.message}
                                              format="hex"
                                              swatches={[
                                                '#ff0000',
                                                '#ff8800',
                                                '#ffff00',
                                                '#00ff00',
                                                '#0000ff',
                                                '#8800ff',
                                                '#ffffff',
                                                '#000000',
                                              ]}
                                            />
                                          )}
                                        />

                                        <Stack gap={4}>
                                          <Text size="sm" fw={500}>
                                            {t('options.optionImage.title')}
                                          </Text>
                                          <Text size="xs" c="dimmed">
                                            {t(
                                              'options.optionImage.description'
                                            )}
                                          </Text>
                                          <Controller
                                            control={control}
                                            name={`options.${optIndex}.images`}
                                            render={({ field }) => (
                                              <Dropzone
                                                value={field.value}
                                                onChange={field.onChange}
                                                accept={getMimePatterns([
                                                  FileType.IMAGE,
                                                ])}
                                                maxSize={5 * 1024 * 1024}
                                                maxFiles={1}
                                              />
                                            )}
                                          />
                                        </Stack>
                                      </>
                                    )}
                                  </Stack>
                                )}
                              </Stack>
                            );
                          })
                        )}
                      </Stack>
                    </SortableContext>
                  </DndContext>

                  {errors.options?.message && (
                    <Text size="xs" c="red">
                      {errors.options.message}
                    </Text>
                  )}

                  <Button
                    variant="default"
                    size="sm"
                    leftSection={<Plus size={14} />}
                    onClick={handleAddOption}
                  >
                    {t('options.addOption')}
                  </Button>
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
                icon={Activity}
                iconColor="orange"
              >
                <Controller
                  control={control}
                  name="sortOrder"
                  render={({ field, fieldState }) => (
                    <NumberInput
                      {...field}
                      label={t('statusCard.sortOrder.label')}
                      min={0}
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

export default AdminVariantGroupFormPage;
