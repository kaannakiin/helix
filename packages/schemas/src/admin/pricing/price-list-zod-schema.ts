import {
  AdjustmentType,
  CurrencyCode,
  PriceListStatus,
  PriceListType,
  PriceOriginType,
} from '@org/prisma/browser';
import { z } from 'zod';
import { cuidSchema, findDuplicates } from '../../common/common-schemas.js';
import { V } from '../../common/validation-keys.js';

export const priceListPriceSchema = z.object({
  id: z.cuid2(),
  productVariantId: cuidSchema,
  originType: z.enum(PriceOriginType).default('FIXED'),
  price: z
    .number()
    .nonnegative({ error: V.PRICE_NONNEGATIVE })
    .nullable()
    .default(null),
  compareAtPrice: z
    .number()
    .nonnegative({ error: V.PRICE_NONNEGATIVE })
    .nullable()
    .default(null),
  costPrice: z
    .number()
    .nonnegative({ error: V.PRICE_NONNEGATIVE })
    .nullable()
    .default(null),
  adjustmentType: z.enum(AdjustmentType).nullable().default(null),
  adjustmentValue: z.number().nullable().default(null),
});

export type PriceListPriceInput = z.input<typeof priceListPriceSchema>;
export type PriceListPriceOutput = z.output<typeof priceListPriceSchema>;

export const BasePriceListSchema = z.object({
  uniqueId: z.cuid2(),
  name: z
    .string({ error: V.PRICE_LIST_NAME_REQUIRED })
    .trim()
    .min(1, { error: V.PRICE_LIST_NAME_REQUIRED }),
  type: z.enum(PriceListType).default('BASE'),
  status: z.enum(PriceListStatus).default('DRAFT'),
  currencyCode: z.enum(CurrencyCode, { error: V.PRICE_LIST_CURRENCY_REQUIRED }),
  parentPriceListId: cuidSchema.nullable().default(null),
  adjustmentType: z.enum(AdjustmentType).nullable().default(null),
  adjustmentValue: z.number().nullable().default(null),
  validFrom: z.coerce.date().nullable().default(null),
  validTo: z.coerce.date().nullable().default(null),
  priority: z.number().int().nonnegative().default(0),
  description: z.string().nullable().default(null),
  isActive: z.boolean().default(true),
  prices: z.array(priceListPriceSchema).default([]),
});

const checkPriceList = ({
  issues,
  value,
}: {
  issues: z.core.$ZodRawIssue[];
  value: z.output<typeof BasePriceListSchema>;
}) => {
  const dupes = findDuplicates(value.prices, (p) => p.productVariantId);
  for (const dupe of dupes) {
    issues.push({
      code: 'custom',
      input: value.prices[dupe.index].productVariantId,
      error: V.DUPLICATE_VARIANT_PRICE,
      path: ['prices', dupe.index, 'productVariantId'],
    });
  }

  for (let i = 0; i < value.prices.length; i++) {
    const p = value.prices[i];
    if (p.originType === 'FIXED' && p.price === null) {
      issues.push({
        code: 'custom',
        input: p.price,
        error: V.PRICE_REQUIRED,
        path: ['prices', i, 'price'],
      });
    }
  }

  if (value.validFrom && value.validTo && value.validFrom >= value.validTo) {
    issues.push({
      code: 'custom',
      input: value.validTo,
      error: V.REQUIRED,
      path: ['validTo'],
    });
  }
};

export const PriceListSchema = BasePriceListSchema.check(checkPriceList);
export const BackendPriceListSchema = BasePriceListSchema.check(checkPriceList);

export type PriceListInput = z.input<typeof PriceListSchema>;
export type PriceListOutput = z.output<typeof PriceListSchema>;
