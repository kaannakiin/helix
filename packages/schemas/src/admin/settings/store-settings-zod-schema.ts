import {
  BusinessModel,
  CurrencyCode,
  Locale,
  StoreStatus,
} from '@org/prisma/browser';
import { z } from 'zod';
import { V } from '../../common/validation-keys.js';

export const CreateStoreSchema = z.object({
  name: z
    .string({ error: V.NAME_REQUIRED })
    .trim()
    .min(1, { error: V.NAME_REQUIRED })
    .max(255),
  slug: z
    .string({ error: V.REQUIRED })
    .trim()
    .min(1, { error: V.REQUIRED })
    .max(100)
    .regex(/^[a-z0-9-]+$/, { error: V.SLUG_PATTERN }),
  businessModel: z.enum(BusinessModel, { error: V.REQUIRED }),
  status: z.enum(StoreStatus, { error: V.REQUIRED }),
  defaultLocale: z.enum(Locale, { error: V.LOCALE_REQUIRED }),
  currency: z.enum(CurrencyCode, { error: V.REQUIRED }),
  timezone: z.string().nullish(),
  description: z.string().nullish(),
  logoUrl: z.string().nullish(),
});

export const UpdateStoreSchema = CreateStoreSchema.partial();

export type CreateStoreInput = z.input<typeof CreateStoreSchema>;
export type CreateStoreOutput = z.output<typeof CreateStoreSchema>;

export type UpdateStoreInput = z.input<typeof UpdateStoreSchema>;
export type UpdateStoreOutput = z.output<typeof UpdateStoreSchema>;
