'use client';

import type {
  FileRejection,
  DropzoneProps as MantineDropzoneProps,
} from '@mantine/dropzone';
import { notifications } from '@mantine/notifications';
import { useTranslations } from 'next-intl';
import { Activity } from 'react';
import { cn } from '../../utils/cn';
import { useDropzoneFiles } from '../hooks/useDropzoneFiles';
import { useFilePreview } from '../hooks/useFilePreview';
import type { DropzoneFile, DropzoneTranslations } from '../types';
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
  withFileList = true,
  withPreview = true,
  translations,
  className,
}: DropzoneProps) {
  const t = useTranslations('common.dropzone');

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

  const { files, addFiles, removeFile, reorderFiles } = useDropzoneFiles({
    value,
    onChange,
    maxFiles,
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

  const { preview, openPreview, closePreview } = useFilePreview();

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

  const handlePreview = (file: DropzoneFile) => {
    if (onPreview) {
      onPreview(file);
    } else {
      openPreview(file);
    }
  };

  const handleRemove = (id: string) => {
    const file = files.find((f) => f.id === id);
    removeFile(id);
    if (file && onRemove) onRemove(file);
  };

  const handleReorder = (sourceIndex: number, destIndex: number) => {
    reorderFiles(sourceIndex, destIndex);
    if (onReorder) {
      const reordered = Array.from(files);
      const [moved] = reordered.splice(sourceIndex, 1);
      reordered.splice(destIndex, 0, moved);
      onReorder(reordered.map((f, i) => ({ ...f, order: i })));
    }
  };

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

      <Activity mode={withFileList && files.length > 0 ? 'visible' : 'hidden'}>
        <FileList
          files={files}
          onReorder={handleReorder}
          onPreview={handlePreview}
          onRemove={handleRemove}
          translations={resolvedTranslations}
          disabled={disabled}
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
