import { createZodDto, type ZodDto } from 'nestjs-zod';
import { z } from 'zod';

const VariantGroupCheckSlugSchema = z.object({
  name: z.string().min(1),
  excludeIds: z.string().optional(),
});

export class VariantGroupCheckSlugDTO extends (createZodDto(
  VariantGroupCheckSlugSchema,
) as ZodDto<typeof VariantGroupCheckSlugSchema, false>) {}
