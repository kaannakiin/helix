'use client';

import type { FileWithPath } from '@mantine/dropzone';
import { createId } from '@paralleldrive/cuid2';
import { useCallback } from 'react';
import type { DropzoneFile } from '../types';
import { classifyMime } from '../utils/file-helpers';

interface UseDropzoneFilesOptions {
  value: DropzoneFile[] | null | undefined;
  onChange: (files: DropzoneFile[]) => void;
  maxFiles?: number;

  existingCount?: number;
  onTooManyFiles?: (attempted: number, maxFiles: number) => void;
}

export function useDropzoneFiles({
  value,
  onChange,
  maxFiles,
  existingCount = 0,
  onTooManyFiles,
}: UseDropzoneFilesOptions) {
  const files = value ?? [];

  const addFiles = useCallback(
    (incoming: FileWithPath[]) => {
      const currentCount = files.length;
      const totalCount = currentCount + existingCount;
      let toAdd = incoming;

      if (maxFiles !== undefined) {
        const remaining = maxFiles - totalCount;
        if (remaining <= 0) {
          onTooManyFiles?.(incoming.length, maxFiles);
          return;
        }
        if (incoming.length > remaining) {
          toAdd = incoming.slice(0, remaining);
          onTooManyFiles?.(incoming.length, maxFiles);
        }
      }

      const newFiles: DropzoneFile[] = toAdd.map((file, i) => ({
        id: createId(),
        file,
        fileType: classifyMime(file.type),
        order: currentCount + i,
      }));

      onChange([...files, ...newFiles]);
    },
    [files, onChange, maxFiles, existingCount, onTooManyFiles]
  );

  const removeFile = useCallback(
    (id: string) => {
      const updated = files
        .filter((f) => f.id !== id)
        .map((f, i) => ({ ...f, order: i }));
      onChange(updated);
    },
    [files, onChange]
  );

  const reorderFiles = useCallback(
    (sourceIndex: number, destinationIndex: number) => {
      const reordered = Array.from(files);
      const [moved] = reordered.splice(sourceIndex, 1);
      reordered.splice(destinationIndex, 0, moved);
      const updated = reordered.map((f, i) => ({ ...f, order: i }));
      onChange(updated);
    },
    [files, onChange]
  );

  return { files, addFiles, removeFile, reorderFiles };
}
