import { createZodDto, ZodDto } from 'nestjs-zod';
import { CustomerQuerySchema } from '@org/schemas/admin/customers';

export class CustomerQueryDTO extends (createZodDto(
  CustomerQuerySchema,
) as ZodDto<typeof CustomerQuerySchema, false>) {}
