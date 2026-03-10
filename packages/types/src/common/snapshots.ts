export interface MoneySnapshot {
  amount: number;
  currencyCode: string;
}

export interface ProductIdentitySnapshot {
  productId?: string | null;
  productVariantId?: string | null;
  sku?: string | null;
  name: string;
  unitOfMeasureCode?: string | null;
}

export interface AppliedDiscountSnapshot {
  code?: string | null;
  name: string;
  amount: number;
  currencyCode: string;
}

export interface TaxSnapshot {
  name: string;
  rate: number;
  amount: number;
  currencyCode: string;
}

export interface LinePricingSnapshot {
  unitPrice: MoneySnapshot;
  compareAtPrice?: MoneySnapshot | null;
  appliedDiscounts?: AppliedDiscountSnapshot[];
  taxes?: TaxSnapshot[];
}
