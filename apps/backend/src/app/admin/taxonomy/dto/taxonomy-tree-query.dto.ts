import { LookupQuerySchema } from '@org/schemas/admin/common';
import { createZodDto, type ZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const TaxonomyTreeQuerySchema = LookupQuerySchema.extend({
  parentId: z.coerce.number().int().optional(),
});

export class TaxonomyTreeQueryDTO extends (createZodDto(
  TaxonomyTreeQuerySchema,
) as ZodDto<typeof TaxonomyTreeQuerySchema, false>) {}
