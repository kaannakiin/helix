'use client';

import { useTranslatedZodResolver } from '@org/hooks/useTranslatedZodResolver';
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
  Avatar,
  Badge,
  Button,
  ColorSwatch,
  Divider,
  Drawer,
  Group,
  Radio,
  Stack,
  Text,
  TextInput,
  type DrawerProps,
} from '@mantine/core';
import { VariantGroupType } from '@org/prisma/browser';
import type { ProductInputType } from '@org/schemas/admin/products';
import {
  VariantGroupSchema,
  type VariantGroupInput,
} from '@org/schemas/admin/variants';
import { slugify } from '@org/utils/slugify';
import { createId } from '@paralleldrive/cuid2';
import { ChevronRight, GripVertical, Plus, RotateCcw, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';
import {
  Controller,
  useFieldArray,
  useForm,
  useFormContext,
  useWatch,
  type Control,
} from 'react-hook-form';

type VariantOptionItem = VariantGroupInput['options'][number];

interface SortableOptionRowProps {
  opt: VariantOptionItem;
  isColor: boolean;
  onOpen: () => void;
  onRemove: () => void;
  unnamedLabel: string;
  error?: string;
}

const SortableOptionRow = ({
  opt,
  isColor,
  onOpen,
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
        style={(theme) => ({
          borderRadius: theme.radius.sm,
          border: `1px solid ${
            error ? theme.colors.red[5] : theme.colors.gray[2]
          }`,
          padding: `6px ${theme.spacing.sm}`,
          backgroundColor: theme.white,
        })}
      >
        <ActionIcon
          variant="subtle"
          color="gray"
          size="xs"
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          aria-label="Drag to reorder"
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

        <Group gap={2} wrap="nowrap">
          <ActionIcon
            variant="subtle"
            color="gray"
            size="xs"
            onClick={onOpen}
            aria-label="Edit option"
          >
            <ChevronRight size={14} />
          </ActionIcon>
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
      </Group>
      {error && (
        <Text size="xs" c="red" mt={4}>
          {error}
        </Text>
      )}
    </div>
  );
};

interface RemovedOptionRowProps {
  opt: VariantOptionItem;
  isColor: boolean;
  onRestore: () => void;
  unnamedLabel: string;
  restoreLabel: string;
}

const RemovedOptionRow = ({
  opt,
  isColor,
  onRestore,
  unnamedLabel,
  restoreLabel,
}: RemovedOptionRowProps) => {
  const optionName = opt.translations?.[0]?.name || unnamedLabel;
  const imageUrl = opt.existingImages?.[0]?.url;
  const hasImage = !!imageUrl;

  return (
    <Group
      wrap="nowrap"
      gap="sm"
      style={(theme) => ({
        borderRadius: theme.radius.sm,
        border: `1px dashed ${theme.colors.gray[4]}`,
        padding: `6px ${theme.spacing.sm}`,
        backgroundColor: theme.colors.gray[0],
        opacity: 0.65,
      })}
    >
      {isColor &&
        (hasImage && imageUrl ? (
          <Avatar src={imageUrl} size={28} radius="sm" />
        ) : opt.colorCode ? (
          <ColorSwatch color={opt.colorCode} size={24} />
        ) : (
          <ColorSwatch color="#cccccc" size={24} />
        ))}

      <Text
        size="sm"
        fw={500}
        style={{ flex: 1, minWidth: 0 }}
        lineClamp={1}
        c="dimmed"
      >
        {optionName}
      </Text>

      <ActionIcon
        variant="subtle"
        color="blue"
        size="xs"
        onClick={onRestore}
        title={restoreLabel}
        aria-label={restoreLabel}
      >
        <RotateCcw size={12} />
      </ActionIcon>
    </Group>
  );
};

interface Props extends DrawerProps {
  groupIndex: number;
  groupUniqueId: string;
  originalOptions: VariantGroupInput['options'] | null;
  onFirstOpen: (
    groupUniqueId: string,
    options: VariantGroupInput['options']
  ) => void;
  onOpenOption: (
    optIndex: number,
    draftControl: Control<VariantGroupInput>
  ) => void;
  onCommit: () => void;
}

export const VariantGroupDrawer = ({
  groupIndex,
  groupUniqueId,
  originalOptions,
  onFirstOpen,
  onOpenOption,
  onCommit,
  ...drawerProps
}: Props) => {
  const t = useTranslations('frontend.admin.products.form');
  const tEnums = useTranslations('frontend.enums');
  const locale = useLocale();

  const { getValues: mainGetValues, setValue: mainSetValue } =
    useFormContext<ProductInputType>();

  const resolver = useTranslatedZodResolver(VariantGroupSchema);
  const draftForm = useForm<VariantGroupInput>({
    resolver,
    defaultValues: {
      uniqueId: '',
      type: VariantGroupType.SIZE,
      sortOrder: 0,
      translations: [{ locale: 'TR', name: '', slug: '' }],
      options: [],
    },
  });

  const {
    control: draftControl,
    setValue: draftSetValue,
    getValues: draftGetValues,
    reset: draftReset,
    trigger: draftTrigger,
    formState: { errors: draftErrors },
  } = draftForm;

  const prevOpenedRef = useRef(false);

  useEffect(() => {
    if (drawerProps.opened && !prevOpenedRef.current) {
      const current = mainGetValues(`variantGroups.${groupIndex}`);
      if (current) {
        draftReset(current as unknown as VariantGroupInput);

        if (originalOptions === null) {
          onFirstOpen(
            groupUniqueId,
            current.options ? [...current.options] : []
          );
        }
      }
    }
    prevOpenedRef.current = drawerProps.opened ?? false;
  }, [
    drawerProps.opened,
    groupIndex,
    mainGetValues,
    draftReset,
    onFirstOpen,
    groupUniqueId,
  ]);

  const handleSave = async () => {
    const isValid = await draftTrigger();
    if (!isValid) return;

    const draftValues = draftGetValues();

    mainSetValue(`variantGroups.${groupIndex}`, draftValues as any, {
      shouldDirty: true,
      shouldValidate: false,
    });
    drawerProps.onClose();
    onCommit();
  };

  const handleCancel = () => {
    drawerProps.onClose();
  };

  const {
    fields: optionFields,
    append: appendOption,
    remove: removeOption,
    move: moveOption,
  } = useFieldArray({
    control: draftControl,
    name: 'options',
    keyName: '_key',
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const groupName = useWatch({
    control: draftControl,
    name: 'translations.0.name',
  });

  const groupType = useWatch({
    control: draftControl,
    name: 'type',
  });

  const isColor = groupType === VariantGroupType.COLOR;

  const currentOptions = useWatch({ control: draftControl, name: 'options' });
  const effectiveOriginalOptions = originalOptions ?? [];
  const removedOptions = effectiveOriginalOptions.filter(
    (orig) => !currentOptions?.some((o) => o.uniqueId === orig.uniqueId)
  );

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
      draftSetValue(`options.${i}.sortOrder`, i, { shouldDirty: true });
    });
  };

  const handleAddOption = () => {
    appendOption({
      uniqueId: createId(),
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
  };

  return (
    <Drawer
      {...drawerProps}
      onClose={handleCancel}
      title={
        <Text fw={600} size="md">
          {groupName || t('variants.unnamedGroup')}
        </Text>
      }
      position="right"
      size="md"
    >
      <Stack gap="md">
        <Controller
          control={draftControl}
          name="translations.0.name"
          render={({ field, fieldState }) => (
            <TextInput
              {...field}
              onChange={(e) => {
                field.onChange(e);
                draftSetValue(
                  'translations.0.slug',
                  slugify(e.target.value, locale),
                  { shouldDirty: true }
                );
              }}
              label={t('variants.groupDrawer.name')}
              placeholder={t('variants.groupDrawer.namePlaceholder')}
              error={fieldState.error?.message}
            />
          )}
        />

        <Controller
          control={draftControl}
          name="type"
          render={({ field, fieldState }) => (
            <Radio.Group
              label={t('variants.groupDrawer.type')}
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
                        {tEnums('variantGroupType.SIZE')}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {t('variants.groupDrawer.sizeDescription')}
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
                        {tEnums('variantGroupType.COLOR')}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {t('variants.groupDrawer.colorDescription')}
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

        <Divider
          label={t('variants.groupDrawer.options')}
          labelPosition="left"
        />

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
                <Text size="sm" c="dimmed">
                  {t('variants.noOptions')}
                </Text>
              ) : (
                optionFields.map((fieldMeta, optIndex) => (
                  <SortableOptionRow
                    key={fieldMeta._key}
                    opt={currentOptions?.[optIndex] ?? fieldMeta}
                    isColor={isColor}
                    onOpen={() => onOpenOption(optIndex, draftControl)}
                    onRemove={() => removeOption(optIndex)}
                    unnamedLabel={t('variants.unnamedOption')}
                    error={
                      draftErrors.options?.[optIndex]?.translations?.[0]?.name
                        ?.message
                    }
                  />
                ))
              )}
            </Stack>
          </SortableContext>
        </DndContext>

        <Button
          variant="default"
          size="sm"
          leftSection={<Plus size={14} />}
          onClick={handleAddOption}
        >
          {t('variants.groupDrawer.addOption')}
        </Button>

        {removedOptions.length > 0 && (
          <>
            <Divider
              label={t('variants.groupDrawer.removedOptions')}
              labelPosition="left"
            />
            <Stack gap="xs">
              {removedOptions.map((opt: VariantOptionItem) => (
                <RemovedOptionRow
                  key={opt.uniqueId}
                  opt={opt}
                  isColor={isColor}
                  onRestore={() => appendOption(opt)}
                  unnamedLabel={t('variants.unnamedOption')}
                  restoreLabel={t('variants.groupDrawer.restoreOption')}
                />
              ))}
            </Stack>
          </>
        )}

        <Divider />

        <Group justify="flex-end">
          <Button variant="default" onClick={handleCancel}>
            {t('variants.cancel')}
          </Button>
          <Button onClick={handleSave}>{t('variants.save')}</Button>
        </Group>
      </Stack>
    </Drawer>
  );
};
