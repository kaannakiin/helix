import type { FileType } from '@org/prisma/browser';

export const IMAGE_OWNER_TYPES = [
  'product',
  'brand',
  'category',
  'tag',
  'productVariant',
  'variantOption',
  'productVariantGroupOption',
] as const;

export type ImageOwnerType = (typeof IMAGE_OWNER_TYPES)[number];

export const IMAGE_OWNER_FIELD_MAP: Record<ImageOwnerType, string> = {
  product: 'productId',
  brand: 'brandId',
  category: 'categoryId',
  tag: 'tagId',
  productVariant: 'productVariantId',
  variantOption: 'variantOptionId',
  productVariantGroupOption: 'productVariantGroupOptionId',
};

export const IMAGE_OWNER_PATH_MAP: Record<ImageOwnerType, string> = {
  product: 'products',
  brand: 'brands',
  category: 'categories',
  tag: 'tags',
  productVariant: 'product-variants',
  variantOption: 'variant-options',
  productVariantGroupOption: 'variant-group-options',
};

export interface UploadResult {
  imageId: string;
  url: string;
  width: number | null;
  height: number | null;
  fileType: FileType;
}
