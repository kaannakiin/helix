import type { FileWithSort } from '@org/types/common';
import { createId } from '@paralleldrive/cuid2';
import type { LucideIcon } from 'lucide-react';
import {
  File as FileIcon,
  FileText,
  Image as ImageIcon,
  Video,
} from 'lucide-react';
import type { DropzoneFile, FileType } from '../types';

/** Classify a MIME type string into a Prisma FileType value */
export function classifyMime(mime: string): FileType {
  if (mime.startsWith('image/')) return 'IMAGE';
  if (mime.startsWith('video/')) return 'VIDEO';
  if (
    mime === 'application/pdf' ||
    mime.includes('word') ||
    mime.includes('document') ||
    mime.includes('spreadsheet') ||
    mime.includes('excel') ||
    mime === 'text/plain' ||
    mime === 'text/csv'
  ) {
    return 'DOCUMENT';
  }
  return 'OTHER';
}

/** Get the appropriate lucide icon component for a FileType */
export function getFileIcon(fileType: FileType): LucideIcon {
  const map: Record<FileType, LucideIcon> = {
    IMAGE: ImageIcon,
    VIDEO: Video,
    DOCUMENT: FileText,
    OTHER: FileIcon,
  };
  return map[fileType];
}

/** Format bytes to a human-readable string */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/** Convert a DropzoneFile to the legacy FileWithSort type */
export function toFileWithSort(df: DropzoneFile): FileWithSort {
  return Object.assign(df.file, { order: df.order });
}

/** Convert a legacy FileWithSort to a DropzoneFile */
export function fromFileWithSort(
  f: FileWithSort,
  fileType?: FileType
): DropzoneFile {
  return {
    id: createId(),
    file: f,
    fileType: fileType ?? classifyMime(f.type),
    order: f.order,
  };
}
