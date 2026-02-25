import {
  ADMIN_TAG_GROUPS_FIELD_CONFIG,
  ADMIN_TAG_GROUPS_SORT_FIELDS,
  ADMIN_TAGS_FIELD_CONFIG,
  ADMIN_TAGS_SORT_FIELDS,
} from '@org/types/admin/tags';
import { z } from 'zod';
import { createDataQuerySchema } from '../../data-query/index.js';

export const TagGroupQuerySchema = createDataQuerySchema({
  fields: ADMIN_TAG_GROUPS_FIELD_CONFIG,
  sortFields: ADMIN_TAG_GROUPS_SORT_FIELDS,
});

export type TagGroupQuerySchemaType = z.infer<typeof TagGroupQuerySchema>;

export const TagQuerySchema = createDataQuerySchema({
  fields: ADMIN_TAGS_FIELD_CONFIG,
  sortFields: ADMIN_TAGS_SORT_FIELDS,
});

export type TagQuerySchemaType = z.infer<typeof TagQuerySchema>;
