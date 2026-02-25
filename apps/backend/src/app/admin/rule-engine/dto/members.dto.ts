import { createZodDto, ZodDto } from 'nestjs-zod';
import { modifyMembersSchema } from '@org/schemas/rule-engine';

export class ModifyMembersDTO extends (createZodDto(
  modifyMembersSchema,
) as ZodDto<typeof modifyMembersSchema, false>) {}
