import { DomainSpaceSchema } from '@org/schemas/admin/settings';
import { createZodDto, type ZodDto } from 'nestjs-zod';

export class DomainSpaceDTO extends (createZodDto(
  DomainSpaceSchema
) as ZodDto<typeof DomainSpaceSchema, false>) {}
