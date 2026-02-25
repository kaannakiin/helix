import { LookupQuerySchema } from '@org/schemas/admin/common';
import { createZodDto, type ZodDto } from 'nestjs-zod';

export class BrandLookupQueryDTO extends (createZodDto(
  LookupQuerySchema,
) as ZodDto<typeof LookupQuerySchema, false>) {}
