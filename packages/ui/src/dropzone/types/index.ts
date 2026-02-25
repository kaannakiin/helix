import type { FileWithPath } from '@mantine/dropzone';
import type { FileType } from '@org/prisma/browser';

export type { FileType } from '@org/prisma/browser';

export interface DropzoneFile {
  /** Stable unique identifier for DnD draggableId and React key */
  id: string;
  /** The underlying File object from Mantine Dropzone */
  file: FileWithPath;
  /** File classification matching Prisma FileType enum */
  fileType: FileType;
  /** Sort order (0-based, contiguous after every mutation) */
  order: number;
}

export type DropzoneValue = DropzoneFile[] | null | undefined;

export interface DropzoneTranslations {
  /** Dropzone area label, e.g. "Drag files here or click to select" */
  dropzoneLabel?: string;
  /** Dropzone sub-label, e.g. "Max 5 files, up to 10MB each" */
  dropzoneSublabel?: string;
  /** Rejection text, e.g. "File type not supported" */
  rejectLabel?: string;
  /** Accessible label for the remove button */
  removeFile?: string;
  /** Accessible label for the preview button */
  previewFile?: string;
  /** Accessible label for the drag handle */
  dragHandle?: string;
  /** Preview modal title */
  previewTitle?: string;
  /** Text shown when no preview is available */
  noPreview?: string;
  /** Notification title when a file is rejected */
  rejectionTitle?: string;
  /** Notification message when file exceeds maxSize. Use __maxSize__ placeholder. */
  fileTooLarge?: string;
  /** Notification message when file type is not accepted */
  fileInvalidType?: string;
  /** Notification message when too many files dropped. Use __maxFiles__ placeholder. */
  tooManyFiles?: string;
}
