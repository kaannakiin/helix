'use client';

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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  Alert,
  Button,
  Drawer,
  Group,
  Stack,
  Switch,
  Text,
  useDrawersStack,
} from '@mantine/core';
import { VariantGroupType } from '@org/prisma/browser';
import type { ProductInputType } from '@org/schemas/admin/products';
import type { VariantGroupInput } from '@org/schemas/admin/variants';
import { FormCard } from '@org/ui/common/form-card';
import { Info, Layers, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import {
  Controller,
  useFieldArray,
  useFormContext,
  type Control,
} from 'react-hook-form';
import { AddVariantGroupModal } from './AddVariantGroupModal';
import { VariantCombinationTable } from './VariantCombinationTable';
import { VariantGroupCard } from './VariantGroupCard';
import { VariantGroupDrawer } from './VariantGroupDrawer';
import { VariantOptionDrawer } from './VariantOptionDrawer';
import { useVariantCombinations } from './useVariantCombinations';

interface Props {
  isNew: boolean;
}

export const VariantCreator = ({ isNew }: Props) => {
  const { recalculate } = useVariantCombinations();
  const t = useTranslations('common.admin.products.form');
  const [modalOpen, setModalOpen] = useState(false);
  const [activeGroupIndex, setActiveGroupIndex] = useState<number | null>(null);
  const [activeOptionIndex, setActiveOptionIndex] = useState<number | null>(
    null
  );
  const [activeDraftControl, setActiveDraftControl] =
    useState<Control<VariantGroupInput> | null>(null);

  const [originalOptionsMap, setOriginalOptionsMap] = useState<
    Map<string, VariantGroupInput['options']>
  >(() => new Map());

  const handleGroupFirstOpen = (
    groupUniqueId: string,
    options: VariantGroupInput['options']
  ) => {
    setOriginalOptionsMap((prev) => {
      if (prev.has(groupUniqueId)) return prev;
      const next = new Map(prev);
      next.set(groupUniqueId, options);
      return next;
    });
  };

  const stack = useDrawersStack(['group', 'option']);

  const { control, setValue } = useFormContext<ProductInputType>();
  const showSwitch = isNew;

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'variantGroups',
    keyName: '_key',
  });

  const existingGroupIds = useMemo(
    () => fields.map((f) => f.uniqueId),
    [fields]
  );
  const hasColorGroup = useMemo(
    () => fields.some((f) => f.type === VariantGroupType.COLOR),
    [fields]
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = fields.findIndex((f) => f.uniqueId === String(active.id));
    const newIndex = fields.findIndex((f) => f.uniqueId === String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    move(oldIndex, newIndex);

    if (activeGroupIndex === oldIndex) {
      setActiveGroupIndex(newIndex);
    } else if (
      activeGroupIndex !== null &&
      oldIndex < newIndex &&
      activeGroupIndex > oldIndex &&
      activeGroupIndex <= newIndex
    ) {
      setActiveGroupIndex(activeGroupIndex - 1);
    } else if (
      activeGroupIndex !== null &&
      oldIndex > newIndex &&
      activeGroupIndex >= newIndex &&
      activeGroupIndex < oldIndex
    ) {
      setActiveGroupIndex(activeGroupIndex + 1);
    }

    const newOrder =
      oldIndex < newIndex
        ? [
            ...fields.slice(0, oldIndex),
            ...fields.slice(oldIndex + 1, newIndex + 1),
            fields[oldIndex],
            ...fields.slice(newIndex + 1),
          ]
        : [
            ...fields.slice(0, newIndex),
            fields[oldIndex],
            ...fields.slice(newIndex, oldIndex),
            ...fields.slice(oldIndex + 1),
          ];

    newOrder.forEach((_, i) => {
      setValue(`variantGroups.${i}.sortOrder`, i, { shouldDirty: true });
    });
  };

  const handleHasVariantsChange = (checked: boolean) => {
    setValue('hasVariants', checked, { shouldValidate: false });
    if (!checked) {
      setValue('variantGroups', [], { shouldValidate: false });
      setValue('variants', [], { shouldValidate: false });
      setActiveGroupIndex(null);
      stack.closeAll();
    }
  };

  const openGroupDrawer = (index: number) => {
    setActiveGroupIndex(index);
    stack.open('group');
  };

  const openOptionDrawer = (
    optIndex: number,
    draftControl: Control<VariantGroupInput>
  ) => {
    setActiveOptionIndex(optIndex);
    setActiveDraftControl(draftControl);
    stack.open('option');
  };

  const handleRemoveGroup = (index: number, uniqueId: string) => {
    setOriginalOptionsMap((prev) => {
      const next = new Map(prev);
      next.delete(uniqueId);
      return next;
    });
    remove(index);
    if (activeGroupIndex === index) {
      stack.closeAll();
      setActiveGroupIndex(null);
    }
    queueMicrotask(recalculate);
  };

  const activeUniqueId = fields[activeGroupIndex ?? 0]?.uniqueId ?? '';

  return (
    <>
      <FormCard
        title={t('variants.title')}
        description={t('variants.description')}
        icon={Layers}
        iconColor="pink"
        rightSection={
          showSwitch ? (
            <Controller
              control={control}
              name="hasVariants"
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onChange={(e) =>
                    handleHasVariantsChange(e.currentTarget.checked)
                  }
                  label={t('variants.toggle')}
                  size="sm"
                />
              )}
            />
          ) : undefined
        }
      >
        <Controller
          control={control}
          name="hasVariants"
          render={({ field: { value: hasVariantsValue } }) => {
            if (!isNew) {
              return (
                <Stack gap="sm">
                  <Alert variant="light" color="gray" icon={<Info size={16} />}>
                    <Text size="sm">
                      {hasVariantsValue
                        ? t('variants.lockedHasVariants')
                        : t('variants.lockedNoVariants')}
                    </Text>
                  </Alert>

                  {hasVariantsValue && (
                    <Stack gap="sm">
                      {fields.length === 0 && (
                        <Text size="sm" c="dimmed">
                          {t('variants.noGroups')}
                        </Text>
                      )}

                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={fields.map((f) => f.uniqueId)}
                          strategy={verticalListSortingStrategy}
                        >
                          <Stack gap="xs">
                            {fields.map((field, index) => (
                              <VariantGroupCard
                                key={field._key}
                                fieldId={field.uniqueId}
                                index={index}
                                onOpen={() => openGroupDrawer(index)}
                                onRemove={() =>
                                  handleRemoveGroup(index, field.uniqueId)
                                }
                              />
                            ))}
                          </Stack>
                        </SortableContext>
                      </DndContext>

                      <Group>
                        <Button
                          variant="default"
                          size="sm"
                          leftSection={<Plus size={14} />}
                          onClick={() => setModalOpen(true)}
                        >
                          {t('variants.addGroup')}
                        </Button>
                      </Group>
                    </Stack>
                  )}
                </Stack>
              );
            }

            if (!hasVariantsValue) {
              return (
                <Text size="sm" c="dimmed">
                  {t('variants.disabled')}
                </Text>
              );
            }

            return (
              <Stack gap="sm">
                {fields.length === 0 && (
                  <Text size="sm" c="dimmed">
                    {t('variants.noGroups')}
                  </Text>
                )}

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={fields.map((f) => f.uniqueId)}
                    strategy={verticalListSortingStrategy}
                  >
                    <Stack gap="xs">
                      {fields.map((field, index) => (
                        <VariantGroupCard
                          key={field._key}
                          fieldId={field.uniqueId}
                          index={index}
                          onOpen={() => openGroupDrawer(index)}
                          onRemove={() =>
                            handleRemoveGroup(index, field.uniqueId)
                          }
                        />
                      ))}
                    </Stack>
                  </SortableContext>
                </DndContext>

                <Group>
                  <Button
                    variant="default"
                    size="sm"
                    leftSection={<Plus size={14} />}
                    onClick={() => setModalOpen(true)}
                  >
                    {t('variants.addGroup')}
                  </Button>
                </Group>
              </Stack>
            );
          }}
        />
      </FormCard>

      <VariantCombinationTable />

      <AddVariantGroupModal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={(group) => {
          append(group);
          queueMicrotask(recalculate);
        }}
        existingGroupIds={existingGroupIds}
        existingGroups={fields}
        hasColorGroup={hasColorGroup}
      />

      <Drawer.Stack>
        <VariantGroupDrawer
          key={`group-${activeGroupIndex}`}
          {...stack.register('group')}
          groupIndex={activeGroupIndex ?? 0}
          groupUniqueId={activeUniqueId}
          originalOptions={originalOptionsMap.get(activeUniqueId) ?? null}
          onFirstOpen={handleGroupFirstOpen}
          onOpenOption={openOptionDrawer}
          onCommit={recalculate}
        />
        <VariantOptionDrawer
          key={`option-${activeGroupIndex}-${activeOptionIndex}`}
          {...stack.register('option')}
          optionIndex={activeOptionIndex ?? 0}
          onCommit={recalculate}
          draftControl={activeDraftControl}
        />
      </Drawer.Stack>
    </>
  );
};
