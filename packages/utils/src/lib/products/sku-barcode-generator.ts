import { slugify } from '@org/utils/slugify';

export interface SkuGeneratorInput {
  productSlug: string;
  optionSlugs: string[];
}

/**
 * Generate a SKU from a product slug and option slugs.
 * Pattern: PRODUCTSLUG-OPTION1-OPTION2 (uppercased, max 50 chars)
 * Inputs can be raw names — they'll be slugified automatically.
 */
export function generateSku({
  productSlug,
  optionSlugs,
}: SkuGeneratorInput): string {
  const base = slugify(productSlug).toUpperCase();
  const suffix = optionSlugs
    .filter(Boolean)
    .map((s) => slugify(s).toUpperCase())
    .join('-');
  const full = suffix ? `${base}-${suffix}` : base;

  return full.slice(0, 50);
}

export function computeEan13CheckDigit(digits12: string): number {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = Number(digits12[i]);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  return (10 - (sum % 10)) % 10;
}

export function generateEan13Barcode(): string {
  let digits12 = '';
  for (let i = 0; i < 12; i++) {
    digits12 += Math.floor(Math.random() * 10).toString();
  }
  const checkDigit = computeEan13CheckDigit(digits12);
  return digits12 + checkDigit.toString();
}
