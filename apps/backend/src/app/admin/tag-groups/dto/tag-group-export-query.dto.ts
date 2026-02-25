import {
  ADMIN_TAG_GROUPS_FIELD_CONFIG,
  ADMIN_TAG_GROUPS_SORT_FIELDS,
} from '@org/types/admin/tags';
import { createZodDto, type ZodDto } from 'nestjs-zod';
import { createExportQuerySchema } from '@org/schemas/export';

const TagGroupExportQuerySchema = createExportQuerySchema({
  fields: ADMIN_TAG_GROUPS_FIELD_CONFIG,
  sortFields: ADMIN_TAG_GROUPS_SORT_FIELDS,
});

export class TagGroupExportQueryDTO extends (createZodDto(
  TagGroupExportQuerySchema,
) as ZodDto<typeof TagGroupExportQuerySchema, false>) {}
