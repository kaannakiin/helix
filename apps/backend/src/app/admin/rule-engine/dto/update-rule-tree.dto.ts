import { createZodDto, ZodDto } from 'nestjs-zod';
import { updateRuleTreeSchema } from '@org/schemas/rule-engine';

export class UpdateRuleTreeDTO extends (createZodDto(
  updateRuleTreeSchema,
) as ZodDto<typeof updateRuleTreeSchema, false>) {}
