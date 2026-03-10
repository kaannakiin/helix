import {
  AdjustmentType,
  CurrencyCode,
  PriceOriginType,
  TaxBehavior,
} from '@org/prisma/browser';
import { z } from 'zod';
import { cuidSchema, dateTimeSchema } from '../../common/common-schemas.js';
import { V } from '../../common/validation-keys.js';

export const BasePriceListPriceSaveSchema = z.object({
  id: z.cuid2().optional(),
  priceListId: cuidSchema,
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
  currencyCode: z.enum(CurrencyCode, {
    error: V.PRICE_LIST_CURRENCY_REQUIRED,
  }),
  minQuantity: z.number().nonnegative().default(1),
  maxQuantity: z.number().nonnegative().nullable().default(null),
  unitOfMeasureId: cuidSchema,
  taxBehavior: z.enum(TaxBehavior).default('INCLUSIVE'),
  validFrom: dateTimeSchema,
  validTo: dateTimeSchema,
  conditionType: z.string().nullable().default(null),
});

const checkPriceListPrice = ({
  issues,
  value,
}: {
  issues: z.core.$ZodRawIssue[];
  value: z.output<typeof BasePriceListPriceSaveSchema>;
}) => {
  if (value.originType === 'FIXED' && value.price === null) {
    issues.push({
      code: 'custom',
      input: value.price,
      error: V.PRICE_REQUIRED,
      path: ['price'],
    });
  }

  if (value.originType === 'RELATIVE') {
    if (!value.adjustmentType) {
      issues.push({
        code: 'custom',
        input: value.adjustmentType,
        error: V.ADJUSTMENT_TYPE_REQUIRED_FOR_RELATIVE,
        path: ['adjustmentType'],
      });
    }
    if (value.adjustmentValue === null) {
      issues.push({
        code: 'custom',
        input: value.adjustmentValue,
        error: V.ADJUSTMENT_VALUE_REQUIRED_FOR_RELATIVE,
        path: ['adjustmentValue'],
      });
    }
  }

  if (
    value.compareAtPrice !== null &&
    value.price !== null &&
    value.compareAtPrice < value.price
  ) {
    issues.push({
      code: 'custom',
      input: value.compareAtPrice,
      error: V.COMPARE_AT_PRICE_MUST_BE_HIGHER,
      path: ['compareAtPrice'],
    });
  }

  if (value.maxQuantity !== null && value.maxQuantity < value.minQuantity) {
    issues.push({
      code: 'custom',
      input: value.maxQuantity,
      error: V.MAX_QTY_MUST_BE_GTE_MIN,
      path: ['maxQuantity'],
    });
  }

  if (value.validFrom && value.validTo && value.validFrom >= value.validTo) {
    issues.push({
      code: 'custom',
      input: value.validTo,
      error: V.DATE_FROM_MUST_BE_BEFORE_TO,
      path: ['validTo'],
    });
  }
};

export const PriceListPriceSaveSchema =
  BasePriceListPriceSaveSchema.check(checkPriceListPrice);
export const BackendPriceListPriceSaveSchema =
  BasePriceListPriceSaveSchema.check(checkPriceListPrice);

export type PriceListPriceSaveInput = z.input<typeof PriceListPriceSaveSchema>;
export type PriceListPriceSaveOutput = z.output<
  typeof PriceListPriceSaveSchema
>;

export const PriceListPriceBulkCreateSchema = z.object({
  priceListId: cuidSchema,
  variantIds: z.array(cuidSchema).min(1),
  currencyCode: z.enum(CurrencyCode, {
    error: V.PRICE_LIST_CURRENCY_REQUIRED,
  }),
  unitOfMeasureId: cuidSchema,
  originType: z.enum(PriceOriginType).default('FIXED'),
});

export type PriceListPriceBulkCreateInput = z.input<
  typeof PriceListPriceBulkCreateSchema
>;
export type PriceListPriceBulkCreateOutput = z.output<
  typeof PriceListPriceBulkCreateSchema
>;

export const NEW_PRICE_LIST_PRICE_DEFAULT_VALUES: PriceListPriceSaveInput = {
  priceListId: '',
  productVariantId: '',
  originType: 'FIXED',
  price: null,
  compareAtPrice: null,
  costPrice: null,
  adjustmentType: null,
  adjustmentValue: null,
  currencyCode: 'TRY',
  minQuantity: 1,
  maxQuantity: null,
  unitOfMeasureId: '',
  taxBehavior: 'INCLUSIVE',
  validFrom: null,
  validTo: null,
  conditionType: null,
};
