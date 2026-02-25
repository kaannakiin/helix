import {
  ADMIN_BRANDS_FIELD_CONFIG,
  ADMIN_BRANDS_SORT_FIELDS,
} from '@org/types/admin/brands';
import { createZodDto, type ZodDto } from 'nestjs-zod';
import { createExportQuerySchema } from '@org/schemas/export';

const BrandExportQuerySchema = createExportQuerySchema({
  fields: ADMIN_BRANDS_FIELD_CONFIG,
  sortFields: ADMIN_BRANDS_SORT_FIELDS,
});

export class BrandExportQueryDTO extends (createZodDto(
  BrandExportQuerySchema,
) as ZodDto<typeof BrandExportQuerySchema, false>) {}
