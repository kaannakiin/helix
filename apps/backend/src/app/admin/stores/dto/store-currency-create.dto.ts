import { StoreCurrencyCreateSchema } from '@org/schemas/admin/settings';
import { createZodDto, type ZodDto } from 'nestjs-zod';

export class StoreCurrencyCreateDTO extends (createZodDto(
  StoreCurrencyCreateSchema
) as ZodDto<typeof StoreCurrencyCreateSchema, false>) {}
