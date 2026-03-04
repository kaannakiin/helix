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
import { Stack } from '@mantine/core';
import type { DropzoneTranslations, UnifiedFile } from '../types';
import { FileListItem } from './FileListItem';

interface FileListProps {
  files: UnifiedFile[];
  onReorder: (sourceIndex: number, destinationIndex: number) => void;
  onPreview: (file: UnifiedFile) => void;
  onRemove: (file: UnifiedFile) => void;
  translations?: DropzoneTranslations;
  disabled?: boolean;
  deletingIds?: Set<string>;
}

export function FileList({
  files,
  onReorder,
  onPreview,
  onRemove,
  translations,
  disabled = false,
  deletingIds,
}: FileListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (files.length === 0) return null;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = files.findIndex((f) => f.id === active.id);
      const newIndex = files.findIndex((f) => f.id === over.id);
      onReorder(oldIndex, newIndex);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={files.map((f) => f.id)}
        strategy={verticalListSortingStrategy}
      >
        <Stack gap={4} mt="sm">
          {files.map((file, index) => (
            <FileListItem
              key={file.id}
              file={file}
              index={index}
              onPreview={onPreview}
              onRemove={onRemove}
              translations={translations}
              disabled={disabled}
              isDeleting={deletingIds?.has(file.id)}
            />
          ))}
        </Stack>
      </SortableContext>
    </DndContext>
  );
}
