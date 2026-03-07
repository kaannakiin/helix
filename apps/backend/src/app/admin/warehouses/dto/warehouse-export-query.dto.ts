import {
  ADMIN_WAREHOUSES_FIELD_CONFIG,
  ADMIN_WAREHOUSES_SORT_FIELDS,
} from '@org/types/admin/warehouses';
import { createZodDto, type ZodDto } from 'nestjs-zod';
import { createExportQuerySchema } from '@org/schemas/export';

const WarehouseExportQuerySchema = createExportQuerySchema({
  fields: ADMIN_WAREHOUSES_FIELD_CONFIG,
  sortFields: ADMIN_WAREHOUSES_SORT_FIELDS,
});

export class WarehouseExportQueryDTO extends (createZodDto(
  WarehouseExportQuerySchema,
) as ZodDto<typeof WarehouseExportQuerySchema, false>) {}
