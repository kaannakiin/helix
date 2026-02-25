import { createZodDto, ZodDto } from 'nestjs-zod';
import { updateCustomerGroupSchema } from '@org/schemas/rule-engine';

export class UpdateCustomerGroupDTO extends (createZodDto(
  updateCustomerGroupSchema,
) as ZodDto<typeof updateCustomerGroupSchema, false>) {}
