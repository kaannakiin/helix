import { type FileType } from '@org/prisma/client';

export interface FileTypeConfig {
  labelKey: string;
  extensions: string[];
  mimePatterns: string[];
}

export const FileTypeConfigs: Record<FileType, FileTypeConfig> = {
  IMAGE: {
    labelKey: 'fileType.image',
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    mimePatterns: ['image/*'],
  },
  VIDEO: {
    labelKey: 'fileType.video',
    extensions: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
    mimePatterns: ['video/*'],
  },
  DOCUMENT: {
    labelKey: 'fileType.document',
    extensions: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'],
    mimePatterns: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
    ],
  },
  OTHER: { labelKey: 'fileType.other', extensions: [], mimePatterns: [] },
};

export function getMimePatterns(fileTypes: FileType[]): string[] {
  return fileTypes.flatMap((ft) => FileTypeConfigs[ft].mimePatterns);
}
