import { BackendBrandSchema } from '@org/schemas/admin/brands';
import { createZodDto, type ZodDto } from 'nestjs-zod';

export class BrandSaveDTO extends (createZodDto(
  BackendBrandSchema
) as ZodDto<typeof BackendBrandSchema, false>) {}
