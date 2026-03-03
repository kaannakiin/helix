import { CustomerGroupQuerySchema } from '@org/schemas/admin/customer-groups';
import { createZodDto, type ZodDto } from 'nestjs-zod';

export class CustomerGroupQueryDTO extends (createZodDto(
  CustomerGroupQuerySchema,
) as ZodDto<typeof CustomerGroupQuerySchema, false>) {}
