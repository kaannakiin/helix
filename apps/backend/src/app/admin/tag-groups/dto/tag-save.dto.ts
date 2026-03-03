import { BackendBaseTagSchema } from '@org/schemas/admin/tags';
import { createZodDto, type ZodDto } from 'nestjs-zod';

export class TagSaveDTO extends (createZodDto(
  BackendBaseTagSchema,
) as ZodDto<typeof BackendBaseTagSchema, false>) {}
