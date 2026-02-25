import { BackendVariantGroupSchema } from '@org/schemas/admin/variants';
import { createZodDto, type ZodDto } from 'nestjs-zod';

export class VariantGroupSaveDTO extends (createZodDto(
  BackendVariantGroupSchema
) as ZodDto<typeof BackendVariantGroupSchema, false>) {}
