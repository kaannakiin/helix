import {
  AdjustmentType,
  CurrencyCode,
  PriceListStatus,
  PriceListType,
  PriceOriginType,
  RoundingRule,
  SourceSystem,
} from '@org/prisma/browser';
import { createId } from '@paralleldrive/cuid2';
import { z } from 'zod';
import {
  cuidSchema,
  dateTimeSchema,
  findDuplicates,
} from '../../common/common-schemas.js';
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
  storeId: cuidSchema,
  type: z.enum(PriceListType).default('BASE'),
  status: z.enum(PriceListStatus).default('DRAFT'),
  defaultCurrencyCode: z.enum(CurrencyCode, {
    error: V.PRICE_LIST_CURRENCY_REQUIRED,
  }),
  parentPriceListId: cuidSchema.nullable().default(null),
  adjustmentType: z.enum(AdjustmentType).nullable().default(null),
  adjustmentValue: z.number().nullable().default(null),
  validFrom: dateTimeSchema,
  validTo: dateTimeSchema,
  priority: z.number().int().nonnegative().default(0),
  description: z.string().nullable().default(null),
  isActive: z.boolean().default(true),
  prices: z.array(priceListPriceSchema).default([]),
  contractRef: z.string().optional(),
  sourceSystem: z.enum(SourceSystem).default('INTERNAL'),
  isSourceLocked: z.boolean().default(false),
  isExchangeRateDerived: z.boolean().default(false),
  sourceCurrencyCode: z.enum(CurrencyCode).nullable().optional(),
  roundingRule: z.enum(RoundingRule).default('NONE'),
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
      error: V.DATE_FROM_MUST_BE_BEFORE_TO,
      path: ['validTo'],
    });
  }

  if (value.isExchangeRateDerived && !value.sourceCurrencyCode) {
    issues.push({
      code: 'custom',
      input: value.sourceCurrencyCode,
      error: V.SOURCE_CURRENCY_REQUIRED_FOR_EXCHANGE_RATE,
      path: ['sourceCurrencyCode'],
    });
  }

  if (
    value.sourceCurrencyCode &&
    value.sourceCurrencyCode === value.defaultCurrencyCode
  ) {
    issues.push({
      code: 'custom',
      input: value.sourceCurrencyCode,
      error: V.SOURCE_CURRENCY_MUST_DIFFER_FROM_DEFAULT,
      path: ['sourceCurrencyCode'],
    });
  }
};

export const PriceListSchema = BasePriceListSchema.check(checkPriceList);
export const BackendPriceListSchema = BasePriceListSchema.check(checkPriceList);

export type PriceListInput = z.input<typeof PriceListSchema>;
export type PriceListOutput = z.output<typeof PriceListSchema>;

export const NEW_PRICE_LIST_DEFAULT_VALUES: PriceListInput = {
  uniqueId: createId(),
  name: '',
  storeId: '',
  type: 'BASE',
  status: 'DRAFT',
  defaultCurrencyCode: 'TRY',
  parentPriceListId: null,
  adjustmentType: null,
  adjustmentValue: null,
  validFrom: null,
  validTo: null,
  priority: 0,
  description: null,
  isActive: true,
  prices: [],
  contractRef: undefined,
  sourceSystem: 'INTERNAL',
  isSourceLocked: false,
  isExchangeRateDerived: false,
  sourceCurrencyCode: null,
  roundingRule: 'NONE',
};
