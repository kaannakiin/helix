import { CategoryQuerySchema } from '@org/schemas/admin/categories';
import { createZodDto, type ZodDto } from 'nestjs-zod';

export class CategoryQueryDTO extends (createZodDto(
  CategoryQuerySchema,
) as ZodDto<typeof CategoryQuerySchema, false>) {}
