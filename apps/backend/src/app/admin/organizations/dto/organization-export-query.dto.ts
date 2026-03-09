import {
  ADMIN_ORGANIZATIONS_FIELD_CONFIG,
  ADMIN_ORGANIZATIONS_SORT_FIELDS,
} from '@org/types/admin/organizations';
import { createZodDto, type ZodDto } from 'nestjs-zod';
import { createExportQuerySchema } from '@org/schemas/export';

const OrganizationExportQuerySchema = createExportQuerySchema({
  fields: ADMIN_ORGANIZATIONS_FIELD_CONFIG,
  sortFields: ADMIN_ORGANIZATIONS_SORT_FIELDS,
});

export class OrganizationExportQueryDTO extends (createZodDto(
  OrganizationExportQuerySchema,
) as ZodDto<typeof OrganizationExportQuerySchema, false>) {}
