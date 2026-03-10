import { StoreCurrencyUpdateSchema } from '@org/schemas/admin/settings';
import { createZodDto, type ZodDto } from 'nestjs-zod';

export class StoreCurrencyUpdateDTO extends (createZodDto(
  StoreCurrencyUpdateSchema
) as ZodDto<typeof StoreCurrencyUpdateSchema, false>) {}
