import { V } from '../common/validation-keys.js';
import { z } from 'zod';

export const UpdateProfileSchema = z.object({
  name: z.string().min(2, V.NAME_MIN).max(128, V.NAME_MAX).optional(),
  surname: z.string().min(2, V.SURNAME_MIN).max(128, V.SURNAME_MAX).optional(),
});

export type UpdateProfileSchemaInputType = z.input<typeof UpdateProfileSchema>;
export type UpdateProfileSchemaOutputType = z.output<typeof UpdateProfileSchema>;
