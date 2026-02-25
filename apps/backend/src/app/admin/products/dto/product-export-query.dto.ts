import {
  ADMIN_PRODUCTS_FIELD_CONFIG,
  ADMIN_PRODUCTS_SORT_FIELDS,
} from '@org/types/admin/products';
import { createZodDto, type ZodDto } from 'nestjs-zod';
import { createExportQuerySchema } from '@org/schemas/export';

const ProductExportQuerySchema = createExportQuerySchema({
  fields: ADMIN_PRODUCTS_FIELD_CONFIG,
  sortFields: ADMIN_PRODUCTS_SORT_FIELDS,
});

export class ProductExportQueryDTO extends (createZodDto(
  ProductExportQuerySchema,
) as ZodDto<typeof ProductExportQuerySchema, false>) {}
