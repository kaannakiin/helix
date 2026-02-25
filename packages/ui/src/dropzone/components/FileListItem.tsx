'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ActionIcon, Group, Paper, Text } from '@mantine/core';
import { Eye, GripVertical, Trash2 } from 'lucide-react';
import type { DropzoneFile, DropzoneTranslations } from '../types';
import { formatFileSize, getFileIcon } from '../utils/file-helpers';

interface FileListItemProps {
  file: DropzoneFile;
  index: number;
  onPreview: (file: DropzoneFile) => void;
  onRemove: (id: string) => void;
  translations?: DropzoneTranslations;
  disabled?: boolean;
}

export function FileListItem({
  file,
  index,
  onPreview,
  onRemove,
  translations,
  disabled = false,
}: FileListItemProps) {
  const Icon = getFileIcon(file.fileType);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: file.id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      withBorder
      p="xs"
      shadow={isDragging ? 'md' : undefined}
      opacity={disabled ? 0.5 : 1}
    >
      <Group gap="sm" wrap="nowrap">
        <div
          {...attributes}
          {...listeners}
          style={{ display: 'flex', cursor: disabled ? 'not-allowed' : 'grab' }}
          aria-label={translations?.dragHandle ?? 'Drag to reorder'}
        >
          <GripVertical size={16} />
        </div>

        <Icon size={18} style={{ flexShrink: 0 }} />

        <Text size="sm" truncate flex={1}>
          {file.file.name}
        </Text>

        <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
          {formatFileSize(file.file.size)}
        </Text>

        <ActionIcon
          variant="subtle"
          size="sm"
          onClick={() => onPreview(file)}
          aria-label={translations?.previewFile ?? 'Preview file'}
        >
          <Eye size={16} />
        </ActionIcon>

        <ActionIcon
          variant="subtle"
          color="red"
          size="sm"
          onClick={() => onRemove(file.id)}
          disabled={disabled}
          aria-label={translations?.removeFile ?? 'Remove file'}
        >
          <Trash2 size={16} />
        </ActionIcon>
      </Group>
    </Paper>
  );
}
