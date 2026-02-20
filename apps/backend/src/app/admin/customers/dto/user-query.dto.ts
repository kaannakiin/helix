import { createZodDto, ZodDto } from 'nestjs-zod';
import { UserQuerySchema } from '@org/schemas/admin/customers';

export class UserQueryDTO extends (createZodDto(
  UserQuerySchema,
) as ZodDto<typeof UserQuerySchema, false>) {}
