import {
  ADMIN_CATEGORIES_FIELD_CONFIG,
  ADMIN_CATEGORIES_SORT_FIELDS,
} from '@org/types/admin/categories';
import { createZodDto, type ZodDto } from 'nestjs-zod';
import { createExportQuerySchema } from '@org/schemas/export';

const CategoryExportQuerySchema = createExportQuerySchema({
  fields: ADMIN_CATEGORIES_FIELD_CONFIG,
  sortFields: ADMIN_CATEGORIES_SORT_FIELDS,
});

export class CategoryExportQueryDTO extends (createZodDto(
  CategoryExportQuerySchema,
) as ZodDto<typeof CategoryExportQuerySchema, false>) {}
