import { VariantGroupQuerySchema } from '@org/schemas/admin/variants';
import { createZodDto, type ZodDto } from 'nestjs-zod';

export class VariantGroupQueryDTO extends (createZodDto(
  VariantGroupQuerySchema,
) as ZodDto<typeof VariantGroupQuerySchema, false>) {}
