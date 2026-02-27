import { FileType } from '@org/prisma/browser';
import { z } from 'zod';
import { V } from './validation-keys.js';

export interface DropzoneFile {
  id: string;
  file: File;
  fileType: FileType;
  order: number;
}

export const passwordSchema = z
  .string({ error: V.PASSWORD_REQUIRED })
  .min(6, { error: V.PASSWORD_MIN })
  .max(128, { error: V.PASSWORD_MAX });

export const cuidSchema = z.cuid2();
export const metaTitleSchema = z.string().min(1, { error: V.REQUIRED });
export const metaDescriptionSchema = z.string().min(1, { error: V.REQUIRED });

export const slugSchema = z
  .string({ error: V.REQUIRED })
  .trim()
  .min(1, { error: V.REQUIRED })
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, { error: V.SLUG_PATTERN });

export const sortOrderSchema = z.number().int().nonnegative().default(0);

export const urlSchema = z.url().nullish().or(z.literal(''));

export const hexColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/)
  .nullish()
  .or(z.literal(''));

export const existingImageSchema = z.object({
  id: z.cuid2(),
  url: z.string(),
  fileType: z.enum(FileType),
  sortOrder: z.number().int().nonnegative().default(0),
});

export function dropzoneFileSchema(options: {
  maxFiles: number;
  allowedTypes: FileType[];
  required?: boolean;
}) {
  const schema = z
    .array(z.custom<DropzoneFile>())
    .max(options.maxFiles, { error: V.FILES_TOO_MANY });

  return options.required ? schema.min(1) : schema.default([]);
}

export function findDuplicates<T>(
  items: T[],
  keyFn: (item: T) => unknown
): Array<{ index: number; key: unknown }> {
  const seen = new Map<unknown, number>();
  const dupes: Array<{ index: number; key: unknown }> = [];

  for (let i = 0; i < items.length; i++) {
    const key = keyFn(items[i]);
    if (seen.has(key)) {
      dupes.push({ index: i, key });
    } else {
      seen.set(key, i);
    }
  }

  return dupes;
}
