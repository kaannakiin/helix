import { StoreHostBindingSchema } from '@org/schemas/admin/settings';
import { createZodDto, type ZodDto } from 'nestjs-zod';

export class StoreHostBindingDTO extends (createZodDto(
  StoreHostBindingSchema
) as ZodDto<typeof StoreHostBindingSchema, false>) {}
