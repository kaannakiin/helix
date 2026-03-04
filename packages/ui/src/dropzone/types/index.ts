import type { FileWithPath } from '@mantine/dropzone';
import type { FileType } from '@org/prisma/browser';

export type { FileType } from '@org/prisma/browser';

export interface DropzoneFile {
  id: string;
  file: FileWithPath;
  fileType: FileType;
  order: number;
}

export type DropzoneValue = DropzoneFile[] | null | undefined;

export interface RemoteFile {
  id: string;
  url: string;
  fileType: FileType;
  order: number;
}

export type UnifiedFile = DropzoneFile | RemoteFile;

export function isRemoteFile(item: UnifiedFile): item is RemoteFile {
  return !('file' in item);
}

export interface DropzoneTranslations {
  dropzoneLabel?: string;
  dropzoneSublabel?: string;
  rejectLabel?: string;
  removeFile?: string;
  previewFile?: string;
  dragHandle?: string;
  previewTitle?: string;
  noPreview?: string;
  rejectionTitle?: string;
  fileTooLarge?: string;
  fileInvalidType?: string;
  tooManyFiles?: string;
}
