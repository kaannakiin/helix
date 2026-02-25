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
}

export function useDropzoneFiles({
  value,
  onChange,
  maxFiles,
}: UseDropzoneFilesOptions) {
  const files = value ?? [];

  /** Add new files from a drop/select event */
  const addFiles = useCallback(
    (incoming: FileWithPath[]) => {
      const currentCount = files.length;
      let toAdd = incoming;

      if (maxFiles !== undefined) {
        const remaining = maxFiles - currentCount;
        if (remaining <= 0) return;
        toAdd = incoming.slice(0, remaining);
      }

      const newFiles: DropzoneFile[] = toAdd.map((file, i) => ({
        id: createId(),
        file,
        fileType: classifyMime(file.type),
        order: currentCount + i,
      }));

      onChange([...files, ...newFiles]);
    },
    [files, onChange, maxFiles]
  );

  /** Remove a file by its stable ID */
  const removeFile = useCallback(
    (id: string) => {
      const updated = files
        .filter((f) => f.id !== id)
        .map((f, i) => ({ ...f, order: i }));
      onChange(updated);
    },
    [files, onChange]
  );

  /** Reorder after a drag-and-drop event */
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
