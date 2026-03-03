import { CustomerGroupSchema } from '@org/schemas/admin/customer-groups';
import { createZodDto, type ZodDto } from 'nestjs-zod';

export class CustomerGroupSaveDTO extends (createZodDto(
  CustomerGroupSchema
) as ZodDto<typeof CustomerGroupSchema, false>) {}
