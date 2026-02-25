import { BackendTagGroupSchema } from '@org/schemas/admin/tags';
import { createZodDto, type ZodDto } from 'nestjs-zod';

export class TagGroupSaveDTO extends (createZodDto(
  BackendTagGroupSchema
) as ZodDto<typeof BackendTagGroupSchema, false>) {}
