import { LookupQuerySchema } from '@org/schemas/admin/common';
import { createZodDto, type ZodDto } from 'nestjs-zod';
import { z } from 'zod';

const VariantGroupLookupQuerySchema = LookupQuerySchema.extend({
  exclude: z.string().optional(),
});

export class VariantGroupLookupQueryDTO extends (createZodDto(
  VariantGroupLookupQuerySchema
) as ZodDto<typeof VariantGroupLookupQuerySchema, false>) {}
