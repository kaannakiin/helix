import {
  ADMIN_VARIANT_GROUPS_FIELD_CONFIG,
  ADMIN_VARIANT_GROUPS_SORT_FIELDS,
} from '@org/types/admin/variants';
import { createZodDto, type ZodDto } from 'nestjs-zod';
import { createExportQuerySchema } from '@org/schemas/export';

const VariantGroupExportQuerySchema = createExportQuerySchema({
  fields: ADMIN_VARIANT_GROUPS_FIELD_CONFIG,
  sortFields: ADMIN_VARIANT_GROUPS_SORT_FIELDS,
});

export class VariantGroupExportQueryDTO extends (createZodDto(
  VariantGroupExportQuerySchema,
) as ZodDto<typeof VariantGroupExportQuerySchema, false>) {}
