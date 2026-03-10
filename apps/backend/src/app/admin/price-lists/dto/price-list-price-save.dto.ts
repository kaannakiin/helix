import { BackendPriceListPriceSaveSchema } from '@org/schemas/admin/pricing';
import { createZodDto, type ZodDto } from 'nestjs-zod';

export class PriceListPriceSaveDTO extends (createZodDto(
  BackendPriceListPriceSaveSchema
) as ZodDto<typeof BackendPriceListPriceSaveSchema, false>) {}
