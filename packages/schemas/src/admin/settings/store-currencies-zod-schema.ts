import { CurrencyCode } from '@org/prisma/browser';
import { z } from 'zod';
import { V } from '../../common/validation-keys.js';

export const StoreCurrencyCreateSchema = z.object({
  currencyCode: z.enum(CurrencyCode, { error: V.REQUIRED }),
  isSelectable: z.boolean().default(true),
  allowCheckout: z.boolean().default(false),
  sortOrder: z.number().int().nonnegative().default(0),
});

export const StoreCurrencyUpdateSchema = z.object({
  isSelectable: z.boolean().optional(),
  allowCheckout: z.boolean().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
});

export type StoreCurrencyCreateInput = z.input<typeof StoreCurrencyCreateSchema>;
export type StoreCurrencyCreateOutput = z.output<typeof StoreCurrencyCreateSchema>;
export type StoreCurrencyUpdateInput = z.input<typeof StoreCurrencyUpdateSchema>;
export type StoreCurrencyUpdateOutput = z.output<typeof StoreCurrencyUpdateSchema>;
