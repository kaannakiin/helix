import { LookupQuerySchema } from '@org/schemas/admin/common';
import { createZodDto, type ZodDto } from 'nestjs-zod';
import { z } from 'zod/v4';

export const TagLookupQuerySchema = LookupQuerySchema.extend({
  tagGroupId: z.string().optional(),
});

export class TagLookupQueryDTO extends (createZodDto(
  TagLookupQuerySchema,
) as ZodDto<typeof TagLookupQuerySchema, false>) {}
