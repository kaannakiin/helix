'use client';

import {
  Dropzone as MantineDropzone,
  type DropzoneProps as MantineDropzoneProps,
  type FileWithPath,
  type FileRejection,
} from '@mantine/dropzone';
import { Stack, Text } from '@mantine/core';
import { Upload, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { DropzoneTranslations } from '../types';

interface DropzoneAreaProps
  extends Omit<MantineDropzoneProps, 'onDrop' | 'children'> {
  onDrop: (files: FileWithPath[]) => void;
  onReject?: (rejections: FileRejection[]) => void;
  translations?: DropzoneTranslations;
  className?: string;
}

const DEFAULT_TRANSLATIONS = {
  dropzoneLabel: 'Drag files here or click to select',
  dropzoneSublabel: 'Attach as many files as you like',
  rejectLabel: 'File type not supported',
};

export function DropzoneArea({
  onDrop,
  onReject,
  translations,
  className,
  ...rest
}: DropzoneAreaProps) {
  const t = {
    ...DEFAULT_TRANSLATIONS,
    ...translations,
  };

  // maxFiles is intentionally excluded from Mantine — Mantine only checks the
  // count within a single drop event and has no awareness of already-added files.
  // The limit is enforced in useDropzoneFiles instead.
  const { maxFiles: _maxFiles, ...mantineProps } = rest;

  return (
    <MantineDropzone
      onDrop={onDrop}
      onReject={onReject}
      className={cn('transition-colors', className)}
      {...mantineProps}
    >
      <Stack align="center" justify="center" gap="xs" mih={120}>
        <MantineDropzone.Accept>
          <Upload
            size={40}
            strokeWidth={1.5}
            className="text-primary-6 dark:text-primary-4"
          />
        </MantineDropzone.Accept>

        <MantineDropzone.Reject>
          <X
            size={40}
            strokeWidth={1.5}
            className="text-red-500"
          />
        </MantineDropzone.Reject>

        <MantineDropzone.Idle>
          <Upload
            size={40}
            strokeWidth={1.5}
            className="text-gray-400 dark:text-gray-500"
          />
        </MantineDropzone.Idle>

        <div className="text-center">
          <Text size="md" fw={500} className="text-gray-700 dark:text-gray-200">
            {t.dropzoneLabel}
          </Text>
          <Text size="sm" mt={4} className="text-gray-500 dark:text-gray-400">
            {t.dropzoneSublabel}
          </Text>
        </div>
      </Stack>
    </MantineDropzone>
  );
}
