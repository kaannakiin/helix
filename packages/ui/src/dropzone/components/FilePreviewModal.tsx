'use client';

import { Button, Modal, Stack, Text } from '@mantine/core';
import { Download } from 'lucide-react';
import type { DropzoneFile, DropzoneTranslations, FileType } from '../types';
import {
  extractFilenameFromUrl,
  formatFileSize,
  getFileIcon,
} from '../utils/file-helpers';

interface FilePreviewModalProps {
  opened: boolean;
  onClose: () => void;
  file: DropzoneFile | null;
  url: string | null;
  fileType: FileType | null;
  translations?: DropzoneTranslations;
}

function ImagePreview({ url, name }: { url: string; name: string }) {
  return (
    <div className="flex h-[600px] w-full items-center justify-center overflow-hidden bg-gray-50/50">
      <img src={url} alt={name} className="h-full w-full object-contain" />
    </div>
  );
}

function VideoPreview({ url }: { url: string }) {
  return (
    <div className="flex h-[600px] w-full items-center justify-center overflow-hidden bg-gray-900">
      <video src={url} controls className="h-full w-full object-contain" />
    </div>
  );
}

function FallbackPreview({
  name,
  size,
  fileType,
  url,
  noPreviewText,
}: {
  name: string;
  size: number | null;
  fileType: FileType;
  url: string;
  noPreviewText: string;
}) {
  const Icon = getFileIcon(fileType);

  return (
    <Stack align="center" justify="center" gap="md" py="xl">
      <Icon size={48} />
      <Stack align="center" gap={4}>
        <Text size="md" fw={500}>
          {name}
        </Text>
        {size != null && (
          <Text size="sm" c="dimmed">
            {formatFileSize(size)}
          </Text>
        )}
        <Text size="xs" c="dimmed" mt="xs">
          {noPreviewText}
        </Text>
      </Stack>
      <Button
        component="a"
        href={url}
        download={name}
        variant="light"
        leftSection={<Download size={16} />}
      >
        Download
      </Button>
    </Stack>
  );
}

export function FilePreviewModal({
  opened,
  onClose,
  file,
  url,
  fileType,
  translations,
}: FilePreviewModalProps) {
  const noPreviewText =
    translations?.noPreview ?? 'Preview not available for this file type';

  const displayName = file
    ? file.file.name
    : url
      ? extractFilenameFromUrl(url)
      : 'unknown';

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      withCloseButton={false}
      size="xl"
      centered
      padding={0}
      keepMounted
    >
      {url && fileType === 'IMAGE' && (
        <ImagePreview url={url} name={displayName} />
      )}
      {url && fileType === 'VIDEO' && <VideoPreview url={url} />}
      {url && (fileType === 'DOCUMENT' || fileType === 'OTHER') && (
        <FallbackPreview
          name={displayName}
          size={file ? file.file.size : null}
          fileType={fileType}
          url={url}
          noPreviewText={noPreviewText}
        />
      )}
    </Modal>
  );
}
