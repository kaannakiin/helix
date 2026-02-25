import { createZodDto, ZodDto } from 'nestjs-zod';
import { createRuleTreeSchema } from '@org/schemas/rule-engine';

export class CreateRuleTreeDTO extends (createZodDto(
  createRuleTreeSchema,
) as ZodDto<typeof createRuleTreeSchema, false>) {}
