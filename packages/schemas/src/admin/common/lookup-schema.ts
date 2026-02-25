import { z } from 'zod';

export const LookupQuerySchema = z.object({
  q: z.string().optional(),
  ids: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  page: z.coerce.number().int().min(1).default(1),
});

export type LookupQueryInput = z.input<typeof LookupQuerySchema>;
export type LookupQueryOutput = z.output<typeof LookupQuerySchema>;

export interface LookupItem {
  id: string;
  label: string;
  slug?: string;
  imageUrl?: string;
  group?: string;
  extra?: Record<string, unknown>;
}
