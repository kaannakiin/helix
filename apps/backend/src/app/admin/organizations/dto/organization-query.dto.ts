import { createZodDto, ZodDto } from 'nestjs-zod';
import { OrganizationQuerySchema } from '@org/schemas/admin/organizations';

export class OrganizationQueryDTO extends (createZodDto(
  OrganizationQuerySchema,
) as ZodDto<typeof OrganizationQuerySchema, false>) {}
