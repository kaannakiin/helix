'use client';

import type {
  FileRejection,
  DropzoneProps as MantineDropzoneProps,
} from '@mantine/dropzone';
import { notifications } from '@mantine/notifications';
import { useTranslations } from 'next-intl';
import { Activity, useMemo } from 'react';
import { cn } from '../../utils/cn';
import { useDropzoneFiles } from '../hooks/useDropzoneFiles';
import { useFilePreview } from '../hooks/useFilePreview';
import type {
  DropzoneFile,
  DropzoneTranslations,
  RemoteFile,
  UnifiedFile,
} from '../types';
import { isRemoteFile } from '../types';
import { formatFileSize } from '../utils/file-helpers';
import { DropzoneArea } from './DropzoneArea';
import { FileList } from './FileList';
import { FilePreviewModal } from './FilePreviewModal';

export interface DropzoneProps {
  value: DropzoneFile[] | null | undefined;
  onChange: (files: DropzoneFile[]) => void;
  accept?: MantineDropzoneProps['accept'];
  maxSize?: number;
  maxFiles?: number;
  multiple?: boolean;
  disabled?: boolean;
  loading?: boolean;
  openRef?: React.RefObject<(() => void) | null>;
  onReject?: (rejections: FileRejection[]) => void;
  onPreview?: (file: DropzoneFile) => void;
  onRemove?: (file: DropzoneFile) => void;
  onReorder?: (files: DropzoneFile[]) => void;
  existingFiles?: RemoteFile[];
  onRemoveExisting?: (file: RemoteFile) => void;
  onReorderExisting?: (files: RemoteFile[]) => void;
  deletingIds?: Set<string>;
  withFileList?: boolean;
  withPreview?: boolean;
  translations?: DropzoneTranslations;
  className?: string;
}

export function Dropzone({
  value,
  onChange,
  accept,
  maxSize,
  maxFiles,
  multiple = true,
  disabled = false,
  loading = false,
  openRef,
  onReject,
  onPreview,
  onRemove,
  onReorder,
  existingFiles,
  onRemoveExisting,
  onReorderExisting,
  deletingIds,
  withFileList = true,
  withPreview = true,
  translations,
  className,
}: DropzoneProps) {
  const t = useTranslations('frontend.dropzone');

  const resolvedTranslations: DropzoneTranslations = {
    dropzoneLabel: translations?.dropzoneLabel || t('dropzoneLabel'),
    dropzoneSublabel: translations?.dropzoneSublabel || t('dropzoneSublabel'),
    rejectLabel: translations?.rejectLabel || t('rejectLabel'),
    removeFile: translations?.removeFile || t('removeFile'),
    previewFile: translations?.previewFile || t('previewFile'),
    dragHandle: translations?.dragHandle || t('dragHandle'),
    previewTitle: translations?.previewTitle || t('previewTitle'),
    noPreview: translations?.noPreview || t('noPreview'),
    rejectionTitle: translations?.rejectionTitle || t('rejectionTitle'),
    fileTooLarge: translations?.fileTooLarge || t('fileTooLarge'),
    fileInvalidType: translations?.fileInvalidType || t('fileInvalidType'),
    tooManyFiles: translations?.tooManyFiles || t('tooManyFiles'),
  };

  const existing = existingFiles ?? [];

  const { files, addFiles, removeFile } = useDropzoneFiles({
    value,
    onChange,
    maxFiles,
    existingCount: existing.length,
    onTooManyFiles: (_, max) => {
      notifications.show({
        color: 'red',
        title: resolvedTranslations.rejectionTitle,
        message: resolvedTranslations.tooManyFiles?.replace(
          '__maxFiles__',
          String(max),
        ),
      });
    },
  });

  const { preview, openPreview, openPreviewWithUrl, closePreview } =
    useFilePreview();

  const allItems: UnifiedFile[] = useMemo(() => {
    const remoteWithOrder: RemoteFile[] = existing.map((f, i) => ({
      ...f,
      order: f.order ?? i,
    }));
    const localWithOrder = files.map((f, i) => ({
      ...f,
      order: f.order ?? existing.length + i,
    }));
    return [...remoteWithOrder, ...localWithOrder].sort(
      (a, b) => a.order - b.order,
    );
  }, [existing, files]);

  const handleReject = (rejections: FileRejection[]) => {
    if (onReject) onReject(rejections);

    const codes = new Set(
      rejections.flatMap((r) => r.errors.map((e) => e.code)),
    );

    if (codes.has('file-too-large')) {
      notifications.show({
        color: 'red',
        title: resolvedTranslations.rejectionTitle,
        message: resolvedTranslations.fileTooLarge?.replace(
          '__maxSize__',
          maxSize ? formatFileSize(maxSize) : '',
        ),
      });
    }
    if (codes.has('file-invalid-type')) {
      notifications.show({
        color: 'red',
        title: resolvedTranslations.rejectionTitle,
        message: resolvedTranslations.fileInvalidType,
      });
    }
  };

  const handlePreview = (file: UnifiedFile) => {
    if (isRemoteFile(file)) {
      openPreviewWithUrl(file.url, file.fileType);
    } else if (onPreview) {
      onPreview(file);
    } else {
      openPreview(file);
    }
  };

  const handleRemove = (file: UnifiedFile) => {
    if (isRemoteFile(file)) {
      onRemoveExisting?.(file);
    } else {
      removeFile(file.id);
      onRemove?.(file);
    }
  };

  const handleReorder = (sourceIndex: number, destIndex: number) => {
    const reordered = Array.from(allItems);
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(destIndex, 0, moved);
    const updated = reordered.map((f, i) => ({ ...f, order: i }));

    const newRemote = updated.filter((f): f is RemoteFile => isRemoteFile(f));
    const newLocal = updated.filter(
      (f): f is DropzoneFile => !isRemoteFile(f),
    );

    onReorderExisting?.(newRemote);
    onChange(newLocal);
    onReorder?.(newLocal);
  };

  const hasItems = allItems.length > 0;

  return (
    <div className={cn('w-full', className)}>
      <DropzoneArea
        onDrop={addFiles}
        accept={accept}
        maxSize={maxSize}
        maxFiles={maxFiles}
        multiple={multiple}
        disabled={disabled}
        loading={loading}
        openRef={openRef}
        onReject={handleReject}
        translations={resolvedTranslations}
      />

      <Activity mode={withFileList && hasItems ? 'visible' : 'hidden'}>
        <FileList
          files={allItems}
          onReorder={handleReorder}
          onPreview={handlePreview}
          onRemove={handleRemove}
          translations={resolvedTranslations}
          disabled={disabled}
          deletingIds={deletingIds}
        />
      </Activity>
      <Activity mode={withPreview ? 'visible' : 'hidden'}>
        <FilePreviewModal
          opened={preview.isOpen}
          onClose={closePreview}
          file={preview.file}
          url={preview.url}
          fileType={preview.fileType}
          translations={resolvedTranslations}
        />
      </Activity>
    </div>
  );
}
