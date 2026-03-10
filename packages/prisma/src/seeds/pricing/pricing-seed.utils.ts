import type { CurrencyCode } from '../../client.js';

const BASE_PRICE_BY_CURRENCY: Record<CurrencyCode, number> = {
  TRY: 1180,
  USD: 42,
  EUR: 38,
  GBP: 33,
};

export function shiftDays(referenceDate: Date, offsetDays: number): Date {
  const next = new Date(referenceDate);
  next.setDate(next.getDate() + offsetDays);
  return next;
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function buildBasePrice(params: {
  currencyCode: CurrencyCode;
  storeIndex: number;
  variantIndex: number;
  quantityTier?: number;
}): number {
  const quantityTier = params.quantityTier ?? 0;
  const anchor = BASE_PRICE_BY_CURRENCY[params.currencyCode];
  const gross =
    anchor +
    params.storeIndex * 9 +
    params.variantIndex * 4.35 -
    quantityTier * 3.15;

  return roundMoney(Math.max(gross, 1));
}

export function buildCompareAtPrice(price: number): number {
  return roundMoney(price * 1.18);
}

export function buildCostPrice(price: number): number {
  return roundMoney(price * 0.68);
}

export function buildExchangeSourcePrice(
  targetPrice: number,
  appliedExchangeRate: number,
): number {
  return roundMoney(targetPrice / appliedExchangeRate);
}
