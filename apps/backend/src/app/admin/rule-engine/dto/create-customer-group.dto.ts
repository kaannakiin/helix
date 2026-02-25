import {
  createRuleBasedCustomerGroupSchema,
  createManualCustomerGroupSchema,
} from '@org/schemas/rule-engine';
import { createZodDto, ZodDto } from 'nestjs-zod';

export class CreateRuleBasedCustomerGroupDTO extends (createZodDto(
  createRuleBasedCustomerGroupSchema,
) as ZodDto<typeof createRuleBasedCustomerGroupSchema, false>) {}

export class CreateManualCustomerGroupDTO extends (createZodDto(
  createManualCustomerGroupSchema,
) as ZodDto<typeof createManualCustomerGroupSchema, false>) {}
