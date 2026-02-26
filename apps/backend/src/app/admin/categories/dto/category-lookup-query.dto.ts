import { LookupQuerySchema } from '@org/schemas/admin/common';
import { createZodDto, type ZodDto } from 'nestjs-zod';
import { z } from 'zod/v4';

export const CategoryLookupQuerySchema = LookupQuerySchema.extend({
  parentId: z.string().optional(),
});

export class CategoryLookupQueryDTO extends (createZodDto(
  CategoryLookupQuerySchema,
) as ZodDto<typeof CategoryLookupQuerySchema, false>) {}
