import { LookupQuerySchema } from '@org/schemas/admin/common';
import { createZodDto, type ZodDto } from 'nestjs-zod';

export class WarehouseLookupQueryDTO extends (createZodDto(
  LookupQuerySchema,
) as ZodDto<typeof LookupQuerySchema, false>) {}
