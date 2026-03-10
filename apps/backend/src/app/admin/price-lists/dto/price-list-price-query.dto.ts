import { PriceListPriceQuerySchema } from '@org/schemas/admin/pricing';
import { createZodDto, type ZodDto } from 'nestjs-zod';

export class PriceListPriceQueryDTO extends (createZodDto(
  PriceListPriceQuerySchema
) as ZodDto<typeof PriceListPriceQuerySchema, false>) {}
