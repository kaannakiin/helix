import { BackendPriceListSchema } from '@org/schemas/admin/pricing';
import { createZodDto, type ZodDto } from 'nestjs-zod';

export class PriceListSaveDTO extends (createZodDto(
  BackendPriceListSchema
) as ZodDto<typeof BackendPriceListSchema, false>) {}
