import { ProductQuerySchema } from '@org/schemas/admin/products';
import { createZodDto, type ZodDto } from 'nestjs-zod';

export class ProductQueryDTO extends (createZodDto(
  ProductQuerySchema,
) as ZodDto<typeof ProductQuerySchema, false>) {}
