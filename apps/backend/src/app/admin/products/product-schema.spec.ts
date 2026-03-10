import { ProductSchema } from '@org/schemas/admin/products';

jest.mock('@paralleldrive/cuid2', () => ({
  createId: () => 'tz4a98xxat96iws9zmbrgj3a',
}));

const TEST_IDS = [
  'tz4a98xxat96iws9zmbrgj3a',
  'w6q2m1n8x7p4r9t5y3u2v1ab',
  'j8k4n2p6r1t9v3x5z7b8c9de',
  'm2p4r6t8v1x3z5b7c9d1f2gh',
  'q7r5t3v1x9z8b6c4d2f1g3hj',
] as const;

let testIdIndex = 0;

const nextTestId = () => {
  const value = TEST_IDS[testIdIndex];
  testIdIndex += 1;
  return value;
};

const createVariantGroup = () => {
  const groupId = nextTestId();
  const optionId = nextTestId();

  return {
    group: {
      uniqueId: groupId,
      type: 'SIZE' as const,
      sortOrder: 0,
      displayMode: null,
      translations: [{ locale: 'TR' as const, name: 'Size', slug: 'size' }],
      options: [
        {
          uniqueId: optionId,
          colorCode: '',
          sortOrder: 0,
          translations: [{ locale: 'TR' as const, name: 'XL', slug: 'xl' }],
          existingImages: [],
          images: [],
        },
      ],
    },
    optionId,
  };
};

const createBasePayload = () => {
  testIdIndex = 0;

  const productId = nextTestId();
  const storeId = nextTestId();
  const { group, optionId } = createVariantGroup();
  const variantId = nextTestId();

  return {
    uniqueId: productId,
    activeStores: [storeId],
    type: 'PHYSICAL' as const,
    status: 'DRAFT' as const,
    hasVariants: true,
    brandId: '',
    googleTaxonomyId: null,
    translations: [
      {
        locale: 'TR' as const,
        name: 'Test Product',
        slug: 'test-product',
        shortDescription: '',
        description: '',
      },
    ],
    newImages: [],
    existingImages: [],
    variantGroups: [group],
    variants: [
      {
        uniqueId: variantId,
        uniqueKey: optionId,
        optionValueIds: [optionId],
        sku: '',
        barcode: '',
        isActive: true,
        trackingStrategy: 'NONE' as const,
        costPrice: null,
        costCurrencyCode: null,
        sortOrder: 0,
        newImages: [],
        existingImages: [],
      },
    ],
    categories: [],
    tagIds: [],
    variantPricing: [
      {
        variantUniqueId: variantId,
        price: 10,
        compareAtPrice: 15,
      },
    ],
  };
};

describe('ProductSchema', () => {
  it('requires cost currency when variant cost price is set', () => {
    const payload = createBasePayload();
    payload.variants[0].costPrice = 42;

    const result = ProductSchema.safeParse(payload);

    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ['variants', 0, 'costCurrencyCode'],
        }),
      ])
    );
  });

  it('accepts a variant cost price when cost currency is provided', () => {
    const payload = createBasePayload();
    payload.variants[0].costPrice = 42;
    payload.variants[0].costCurrencyCode = 'TRY';

    const result = ProductSchema.safeParse(payload);

    expect(result.success).toBe(true);
  });
});
