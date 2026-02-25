import { BackendProductSchema } from '@org/schemas/admin/products';
import { createZodDto, type ZodDto } from 'nestjs-zod';

export class ProductSaveDTO extends (createZodDto(
  BackendProductSchema
) as ZodDto<typeof BackendProductSchema, false>) {}
