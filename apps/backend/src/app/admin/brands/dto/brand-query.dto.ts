import { BrandQuerySchema } from '@org/schemas/admin/brands';
import { createZodDto, type ZodDto } from 'nestjs-zod';

export class BrandQueryDTO extends (createZodDto(
  BrandQuerySchema,
) as ZodDto<typeof BrandQuerySchema, false>) {}
