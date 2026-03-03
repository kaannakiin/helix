import {
  ADMIN_PRICE_LISTS_FIELD_CONFIG,
  ADMIN_PRICE_LISTS_SORT_FIELDS,
} from '@org/types/admin/pricing';
import { createZodDto, type ZodDto } from 'nestjs-zod';
import { createExportQuerySchema } from '@org/schemas/export';

const PriceListExportQuerySchema = createExportQuerySchema({
  fields: ADMIN_PRICE_LISTS_FIELD_CONFIG,
  sortFields: ADMIN_PRICE_LISTS_SORT_FIELDS,
});

export class PriceListExportQueryDTO extends (createZodDto(
  PriceListExportQuerySchema,
) as ZodDto<typeof PriceListExportQuerySchema, false>) {}
