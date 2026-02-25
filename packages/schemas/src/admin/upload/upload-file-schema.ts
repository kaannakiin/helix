import { IMAGE_OWNER_TYPES } from '@org/types/admin/upload';
import { z } from 'zod';
import { cuidSchema } from '../../common/common-schemas.js';

export const UploadFileSchema = z.object({
  ownerType: z.enum(IMAGE_OWNER_TYPES),
  ownerId: cuidSchema,
  isNeedWebp: z.boolean().optional().default(true),
  isNeedThumbnail: z.boolean().optional().default(false),
});

export type UploadFileInput = z.input<typeof UploadFileSchema>;
export type UploadFileOutput = z.output<typeof UploadFileSchema>;
