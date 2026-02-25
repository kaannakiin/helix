import { BackendCategorySchema } from '@org/schemas/admin/categories';
import { createZodDto, type ZodDto } from 'nestjs-zod';

export class CategorySaveDTO extends (createZodDto(
  BackendCategorySchema
) as ZodDto<typeof BackendCategorySchema, false>) {}
