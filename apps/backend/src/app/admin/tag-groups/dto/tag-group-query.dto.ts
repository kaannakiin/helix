import { TagGroupQuerySchema } from '@org/schemas/admin/tags';
import { createZodDto, type ZodDto } from 'nestjs-zod';

export class TagGroupQueryDTO extends (createZodDto(
  TagGroupQuerySchema,
) as ZodDto<typeof TagGroupQuerySchema, false>) {}
