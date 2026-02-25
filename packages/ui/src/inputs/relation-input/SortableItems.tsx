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
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ActionIcon,
  CloseButton,
  Group,
  Paper,
  Stack,
  Text,
} from '@mantine/core';
import { GripVertical } from 'lucide-react';
import type { ReactNode } from 'react';
import type { LookupItem } from './types';

interface SortableItemProps {
  item: LookupItem;
  onRemove: (id: string) => void;
  disabled?: boolean;
  renderSelected?: (item: LookupItem) => ReactNode;
}

function SortableItem({
  item,
  onRemove,
  disabled = false,
  renderSelected,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      {...attributes}
      p="xs"
      withBorder
      radius="sm"
    >
      <Group gap="xs" wrap="nowrap">
        <ActionIcon
          variant="subtle"
          color="gray"
          size="sm"
          style={{ cursor: disabled ? 'default' : 'grab' }}
          {...(disabled ? {} : listeners)}
        >
          <GripVertical size={16} />
        </ActionIcon>

        <div style={{ flex: 1, minWidth: 0 }}>
          {renderSelected ? (
            renderSelected(item)
          ) : (
            <Text size="sm" truncate>
              {item.label}
            </Text>
          )}
        </div>

        {!disabled && (
          <CloseButton size="sm" onClick={() => onRemove(item.id)} />
        )}
      </Group>
    </Paper>
  );
}

interface SortableItemsProps {
  items: LookupItem[];
  onReorder: (newIds: string[]) => void;
  onRemove: (id: string) => void;
  disabled?: boolean;
  renderSelected?: (item: LookupItem) => ReactNode;
}

export function SortableItems({
  items,
  onReorder,
  onRemove,
  disabled = false,
  renderSelected,
}: SortableItemsProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(
      items.map((i) => i.id),
      oldIndex,
      newIndex
    );
    onReorder(reordered);
  }

  if (items.length === 0) return null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <Stack gap={4} mt="xs">
          {items.map((item) => (
            <SortableItem
              key={item.id}
              item={item}
              onRemove={onRemove}
              disabled={disabled}
              renderSelected={renderSelected}
            />
          ))}
        </Stack>
      </SortableContext>
    </DndContext>
  );
}
