import { createZodDto, type ZodDto } from 'nestjs-zod';
import { z } from 'zod/v4';

export const TagBulkDeleteSchema = z.object({
  ids: z.array(z.cuid2()).min(1),
});

export class TagBulkDeleteDTO extends (createZodDto(
  TagBulkDeleteSchema,
) as ZodDto<typeof TagBulkDeleteSchema, false>) {}
