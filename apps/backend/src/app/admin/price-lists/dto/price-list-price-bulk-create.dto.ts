import { PriceListPriceBulkCreateSchema } from '@org/schemas/admin/pricing';
import { createZodDto, type ZodDto } from 'nestjs-zod';

export class PriceListPriceBulkCreateDTO extends (createZodDto(
  PriceListPriceBulkCreateSchema
) as ZodDto<typeof PriceListPriceBulkCreateSchema, false>) {}
