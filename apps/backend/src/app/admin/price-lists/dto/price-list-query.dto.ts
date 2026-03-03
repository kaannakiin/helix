import { PriceListQuerySchema } from '@org/schemas/admin/pricing';
import { createZodDto, type ZodDto } from 'nestjs-zod';

export class PriceListQueryDTO extends (createZodDto(
  PriceListQuerySchema,
) as ZodDto<typeof PriceListQuerySchema, false>) {}
