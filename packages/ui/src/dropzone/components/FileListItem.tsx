'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ActionIcon, Group, Image, Loader, Paper, Text } from '@mantine/core';
import { Eye, GripVertical, Trash2 } from 'lucide-react';
import type { DropzoneTranslations, UnifiedFile } from '../types';
import { isRemoteFile } from '../types';
import {
  extractFilenameFromUrl,
  formatFileSize,
  getFileIcon,
} from '../utils/file-helpers';

interface FileListItemProps {
  file: UnifiedFile;
  index: number;
  onPreview: (file: UnifiedFile) => void;
  onRemove: (file: UnifiedFile) => void;
  translations?: DropzoneTranslations;
  disabled?: boolean;
  isDeleting?: boolean;
}

export function FileListItem({
  file,
  index,
  onPreview,
  onRemove,
  translations,
  disabled = false,
  isDeleting = false,
}: FileListItemProps) {
  const Icon = getFileIcon(file.fileType);
  const remote = isRemoteFile(file);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: file.id,
    disabled: disabled || isDeleting,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
  };

  const displayName = remote
    ? extractFilenameFromUrl(file.url)
    : file.file.name;

  const displaySize = remote ? null : formatFileSize(file.file.size);

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      withBorder
      p="xs"
      shadow={isDragging ? 'md' : undefined}
      opacity={disabled || isDeleting ? 0.5 : 1}
    >
      <Group gap="sm" wrap="nowrap">
        <div
          {...attributes}
          {...listeners}
          style={{
            display: 'flex',
            cursor: disabled || isDeleting ? 'not-allowed' : 'grab',
          }}
          aria-label={translations?.dragHandle ?? 'Drag to reorder'}
        >
          <GripVertical size={16} />
        </div>

        {remote && file.fileType === 'IMAGE' ? (
          <Image
            src={file.url}
            alt={displayName}
            w={32}
            h={32}
            radius={4}
            fit="cover"
            style={{ flexShrink: 0 }}
          />
        ) : (
          <Icon size={18} style={{ flexShrink: 0 }} />
        )}

        <Text size="sm" truncate flex={1}>
          {displayName}
        </Text>

        {displaySize && (
          <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
            {displaySize}
          </Text>
        )}

        <ActionIcon
          variant="subtle"
          size="sm"
          onClick={() => onPreview(file)}
          disabled={isDeleting}
          aria-label={translations?.previewFile ?? 'Preview file'}
        >
          <Eye size={16} />
        </ActionIcon>

        <ActionIcon
          variant="subtle"
          color="red"
          size="sm"
          onClick={() => onRemove(file)}
          disabled={disabled || isDeleting}
          aria-label={translations?.removeFile ?? 'Remove file'}
        >
          {isDeleting ? <Loader size={14} /> : <Trash2 size={16} />}
        </ActionIcon>
      </Group>
    </Paper>
  );
}
