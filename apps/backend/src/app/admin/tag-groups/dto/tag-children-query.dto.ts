import { createZodDto, type ZodDto } from 'nestjs-zod';
import { z } from 'zod/v4';

export const TagChildrenQuerySchema = z.object({
  parentTagId: z.cuid2().optional(),
});

export class TagChildrenQueryDTO extends (createZodDto(
  TagChildrenQuerySchema,
) as ZodDto<typeof TagChildrenQuerySchema, false>) {}
