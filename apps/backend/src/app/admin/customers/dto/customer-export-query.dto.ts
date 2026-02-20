import {
  ADMIN_CUSTOMERS_FIELD_CONFIG,
  ADMIN_CUSTOMERS_SORT_FIELDS,
} from '@org/types/admin/customers';
import { createZodDto, type ZodDto } from 'nestjs-zod';
import { createExportQuerySchema } from '@org/schemas/export';

const CustomerExportQuerySchema = createExportQuerySchema({
  fields: ADMIN_CUSTOMERS_FIELD_CONFIG,
  sortFields: ADMIN_CUSTOMERS_SORT_FIELDS,
});

export class CustomerExportQueryDTO extends (createZodDto(
  CustomerExportQuerySchema,
) as ZodDto<typeof CustomerExportQuerySchema, false>) {}
