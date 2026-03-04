'use client';

import { apiClient } from '@/core/lib/api/api-client';
import type { UploadResult } from '@org/types/admin/upload';
import type { DropzoneFile, RemoteFile } from '@org/ui/dropzone';
import { useMutation } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

interface UseImageUploadOptions {
  basePath: string; // e.g. `/admin/brands/${brandId}/images`
  onDeleteError?: (file: RemoteFile, error: unknown) => void;
  onUploadError?: (file: DropzoneFile, error: unknown) => void;
}

export function useImageUpload({
  basePath,
  onDeleteError,
  onUploadError,
}: UseImageUploadOptions) {
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [isUploading, setIsUploading] = useState(false);

  const deleteImageMutation = useMutation({
    mutationFn: (file: RemoteFile) =>
      apiClient.delete(`${basePath}/${file.id}`),
  });

  const deleteImage = useCallback(
    async (file: RemoteFile) => {
      setDeletingIds((prev) => new Set(prev).add(file.id));
      try {
        await deleteImageMutation.mutateAsync(file);
        return true;
      } catch (err) {
        onDeleteError?.(file, err);
        return false;
      } finally {
        setDeletingIds((prev) => {
          const next = new Set(prev);
          next.delete(file.id);
          return next;
        });
      }
    },
    [deleteImageMutation, onDeleteError]
  );

  const uploadFiles = useCallback(
    async (
      files: DropzoneFile[],
      opts?: { ownerType: string; ownerId: string }
    ) => {
      setIsUploading(true);
      const results: UploadResult[] = [];

      try {
        for (let i = 0; i < files.length; i++) {
          const df = files[i];
          const formData = new FormData();
          formData.append('file', df.file);
          if (opts) {
            formData.append('ownerType', opts.ownerType);
            formData.append('ownerId', opts.ownerId);
          }

          try {
            const res = await apiClient.post<UploadResult>(basePath, formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
            results.push(res.data);
          } catch (err) {
            onUploadError?.(df, err);
          }
        }
      } finally {
        setIsUploading(false);
      }

      return results;
    },
    [basePath, onUploadError]
  );

  return {
    deletingIds,
    isUploading,
    deleteImage,
    uploadFiles,
  };
}
