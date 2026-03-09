import type {
  ProductStatus,
  ProductType,
  VariantGroupDisplayMode,
  VariantGroupType,
} from '../client.js';
import { prisma } from '../prisma.js';
import {
  CATALOG_BRANDS,
  CATALOG_CATEGORY_TREE,
  CATALOG_SERIES,
  CATALOG_TAG_GROUPS,
  CATALOG_VARIANT_GROUPS,
  PRODUCT_FAMILIES,
  type ProductFamilyDefinition,
  type SeedCategoryNode,
  type SeedTagNode,
} from './catalog-seed.data.js';
import {
  CATALOG_BRAND_SLUG_PREFIX,
  CATALOG_CATEGORY_SLUG_PREFIX,
  CATALOG_PRODUCT_SLUG_PREFIX,
  CATALOG_STORE_SLUGS,
  CATALOG_TAG_GROUP_SLUG_PREFIX,
  CATALOG_VARIANT_GROUP_SLUG_PREFIX,
  resolveCatalogSeedCount,
} from './catalog-seed.config.js';
import {
  buildEditionLabel,
  buildEan13Barcode,
  buildSku,
  cartesianProduct,
  compact,
  hashToInt,
  makeImageUrl,
  makeSeedSlug,
  makeSeedTranslations,
  resolveImageCount,
  resolveProductStatus,
  resolveStoreVisibility,
  rotateSlice,
  type SeedTranslationRecord,
} from './catalog-seed.utils.js';

type SeedStore = {
  id: string;
  slug: (typeof CATALOG_STORE_SLUGS)[number];
  name: string;
};

type SeedEntityRecord = {
  id: string;
  slug: string;
};

type SeedOptionRecord = SeedEntityRecord & {
  baseSlug: string;
  nameEn: string;
  nameTr: string;
  colorCode: string | null;
};

type SeedVariantGroupRecord = SeedEntityRecord & {
  baseSlug: string;
  type: VariantGroupType;
  options: SeedOptionRecord[];
};

type ProductSeedPlan = {
  enName: string;
  trName: string;
  enSlug: string;
  trSlug: string;
  type: ProductType;
  status: ProductStatus;
  family: ProductFamilyDefinition;
  brandBaseSlug: string;
  categoryBaseSlugs: string[];
  tagBaseSlugs: string[];
  variantGroupSlugs: string[];
  storeSlugs: string[];
  imageCount: number;
  productIndex: number;
};

async function seedCatalogProducts() {
  const targetCount = resolveCatalogSeedCount(process.env['PRODUCT_SEED_COUNT']);
  const stores = await loadStores();

  console.log(`Starting catalog seed with target count ${targetCount}...`);

  const brandSeed = await seedBrands();
  const categorySeed = await seedCategories(stores);
  const tagSeed = await seedTagGroups();
  const variantSeed = await seedVariantGroups();

  const plans = buildProductSeedPlans(targetCount);
  const keptProductIds = new Set<string>();

  for (const plan of plans) {
    const productId = await upsertProduct({
      plan,
      stores,
      brands: brandSeed.records,
      categories: categorySeed.records,
      tags: tagSeed.records,
      variantGroups: variantSeed.records,
    });
    keptProductIds.add(productId);
  }

  await cleanupSeedProducts(keptProductIds);
  await cleanupSeedBrands(brandSeed.keepSlugs);
  await cleanupSeedCategories(categorySeed.keepSlugs);
  await cleanupSeedTagGroups(tagSeed.keepGroupSlugs);
  await cleanupSeedVariantGroups(variantSeed.keepGroupIds);

  console.log('Catalog seed completed.');
  console.log(`Brands: ${brandSeed.records.size}`);
  console.log(`Categories: ${categorySeed.records.size}`);
  console.log(`Tags: ${tagSeed.records.size}`);
  console.log(`Variant groups: ${variantSeed.records.size}`);
  console.log(`Products: ${plans.length}`);
}

async function loadStores(): Promise<Map<(typeof CATALOG_STORE_SLUGS)[number], SeedStore>> {
  const stores = await prisma.store.findMany({
    where: {
      slug: {
        in: [...CATALOG_STORE_SLUGS],
      },
    },
    select: {
      id: true,
      slug: true,
      name: true,
    },
    orderBy: {
      slug: 'asc',
    },
  });

  if (stores.length !== CATALOG_STORE_SLUGS.length) {
    throw new Error(
      'Required stores are missing. Run `npm run seed:stores` in packages/prisma first.',
    );
  }

  return new Map(
    stores.map((store) => [
      store.slug as (typeof CATALOG_STORE_SLUGS)[number],
      {
        id: store.id,
        slug: store.slug as (typeof CATALOG_STORE_SLUGS)[number],
        name: store.name,
      },
    ]),
  );
}

async function seedBrands() {
  const records = new Map<string, SeedEntityRecord>();
  const keepSlugs = new Set<string>();

  for (const [index, brandDef] of CATALOG_BRANDS.entries()) {
    const slug = makeSeedSlug('brand', brandDef.slug);
    keepSlugs.add(slug);

    const existing = await prisma.brand.findUnique({
      where: { slug },
      select: { id: true },
    });

    const brand = existing
      ? await prisma.brand.update({
          where: { id: existing.id },
          data: {
            slug,
            websiteUrl: brandDef.websiteUrl,
            isActive: true,
            sortOrder: index,
          },
        })
      : await prisma.brand.create({
          data: {
            slug,
            websiteUrl: brandDef.websiteUrl,
            isActive: true,
            sortOrder: index,
          },
        });

    await prisma.brandTranslation.deleteMany({
      where: { brandId: brand.id },
    });
    await prisma.brandTranslation.createMany({
      data: makeSeedTranslations(brandDef.en, brandDef.tr).map((translation) => ({
        brandId: brand.id,
        locale: translation.locale,
        name: translation.name,
        description: translation.description ?? null,
      })),
    });

    await prisma.image.deleteMany({
      where: { brandId: brand.id },
    });
    await prisma.image.create({
      data: {
        brandId: brand.id,
        url: makeImageUrl('catalog/brands', slug, 240, 240),
        alt: `${brandDef.en.name} logo`,
        width: 240,
        height: 240,
        fileType: 'IMAGE',
        sortOrder: 0,
        isPrimary: true,
      },
    });

    records.set(brandDef.slug, { id: brand.id, slug });
  }

  return { records, keepSlugs };
}

async function seedCategories(stores: Map<(typeof CATALOG_STORE_SLUGS)[number], SeedStore>) {
  const records = new Map<string, SeedEntityRecord>();
  const keepSlugs = new Set<string>();

  const storeIds = [...stores.values()].map((store) => store.id);

  const upsertNode = async (
    node: SeedCategoryNode,
    parentId: string | null,
    depth: number,
    sortOrder: number,
  ) => {
    const slug = makeSeedSlug('category', node.slug);
    keepSlugs.add(slug);

    const existing = await prisma.category.findUnique({
      where: { slug },
      select: { id: true },
    });

    const category = existing
      ? await prisma.category.update({
          where: { id: existing.id },
          data: {
            slug,
            parentId,
            depth,
            isActive: true,
            sortOrder,
          },
        })
      : await prisma.category.create({
          data: {
            slug,
            parentId,
            depth,
            isActive: true,
            sortOrder,
          },
        });

    await prisma.categoryTranslation.deleteMany({
      where: { categoryId: category.id },
    });
    await prisma.categoryTranslation.createMany({
      data: makeSeedTranslations(node.en, node.tr).map((translation) => ({
        categoryId: category.id,
        locale: translation.locale,
        name: translation.name,
        description: translation.description ?? null,
        metaTitle: `${translation.name} | Catalog`,
        metaDescription: translation.description ?? null,
      })),
    });

    await prisma.image.deleteMany({
      where: { categoryId: category.id },
    });
    await prisma.image.create({
      data: {
        categoryId: category.id,
        url: makeImageUrl('catalog/categories', slug, 960, 720),
        alt: node.en.name,
        width: 960,
        height: 720,
        fileType: 'IMAGE',
        sortOrder: 0,
        isPrimary: true,
      },
    });

    await prisma.categoryStore.deleteMany({
      where: { categoryId: category.id },
    });
    await prisma.categoryStore.createMany({
      data: storeIds.map((storeId) => ({
        categoryId: category.id,
        storeId,
        isVisible: true,
      })),
    });

    records.set(node.slug, { id: category.id, slug });

    for (const [childIndex, child] of (node.children ?? []).entries()) {
      await upsertNode(child, category.id, depth + 1, childIndex);
    }
  };

  for (const [index, node] of CATALOG_CATEGORY_TREE.entries()) {
    await upsertNode(node, null, 0, index);
  }

  return { records, keepSlugs };
}

async function seedTagGroups() {
  const records = new Map<string, SeedEntityRecord>();
  const keepGroupSlugs = new Set<string>();

  for (const [groupIndex, groupDef] of CATALOG_TAG_GROUPS.entries()) {
    const groupSlug = makeSeedSlug('tag-group', groupDef.slug);
    keepGroupSlugs.add(groupSlug);

    const existingGroup = await prisma.tagGroup.findUnique({
      where: { slug: groupSlug },
      select: { id: true },
    });

    const group = existingGroup
      ? await prisma.tagGroup.update({
          where: { id: existingGroup.id },
          data: {
            slug: groupSlug,
            isActive: true,
            sortOrder: groupIndex,
          },
        })
      : await prisma.tagGroup.create({
          data: {
            slug: groupSlug,
            isActive: true,
            sortOrder: groupIndex,
          },
        });

    await prisma.tagGroupTranslation.deleteMany({
      where: { tagGroupId: group.id },
    });
    await prisma.tagGroupTranslation.createMany({
      data: makeSeedTranslations(groupDef.en, groupDef.tr).map((translation) => ({
        tagGroupId: group.id,
        locale: translation.locale,
        name: translation.name,
        description: translation.description ?? null,
      })),
    });

    const keepTagIds = new Set<string>();

    const upsertTag = async (
      node: SeedTagNode,
      parentTagId: string | null,
      depth: number,
      sortOrder: number,
    ) => {
      const tagSlug = makeSeedSlug('tag', node.slug);
      const existingTag = await prisma.tag.findFirst({
        where: {
          tagGroupId: group.id,
          parentTagId,
          slug: tagSlug,
        },
        select: { id: true },
      });

      const tag = existingTag
        ? await prisma.tag.update({
            where: { id: existingTag.id },
            data: {
              slug: tagSlug,
              parentTagId,
              depth,
              isActive: true,
              sortOrder,
            },
          })
        : await prisma.tag.create({
            data: {
              tagGroupId: group.id,
              slug: tagSlug,
              parentTagId,
              depth,
              isActive: true,
              sortOrder,
            },
          });

      keepTagIds.add(tag.id);

      await prisma.tagTranslation.deleteMany({
        where: { tagId: tag.id },
      });
      await prisma.tagTranslation.createMany({
        data: makeSeedTranslations(node.en, node.tr).map((translation) => ({
          tagId: tag.id,
          locale: translation.locale,
          name: translation.name,
          description: translation.description ?? null,
        })),
      });

      records.set(node.slug, { id: tag.id, slug: tagSlug });

      for (const [childIndex, child] of (node.children ?? []).entries()) {
        await upsertTag(child, tag.id, depth + 1, childIndex);
      }
    };

    for (const [tagIndex, tagNode] of groupDef.tags.entries()) {
      await upsertTag(tagNode, null, 0, tagIndex);
    }

    const obsoleteTags = await prisma.tag.findMany({
      where: {
        tagGroupId: group.id,
        NOT: {
          id: {
            in: [...keepTagIds],
          },
        },
      },
      select: {
        id: true,
        depth: true,
      },
      orderBy: {
        depth: 'desc',
      },
    });

    for (const obsoleteTag of obsoleteTags) {
      await prisma.tag.delete({
        where: { id: obsoleteTag.id },
      });
    }
  }

  return { records, keepGroupSlugs };
}

async function seedVariantGroups() {
  const records = new Map<string, SeedVariantGroupRecord>();
  const keepGroupIds = new Set<string>();

  for (const [groupIndex, groupDef] of CATALOG_VARIANT_GROUPS.entries()) {
    const groupSlug = makeSeedSlug('variant-group', groupDef.slug);

    const existingGroupTranslation = await prisma.variantGroupTranslation.findFirst({
      where: {
        locale: 'EN',
        slug: groupSlug,
      },
      select: {
        variantGroupId: true,
      },
    });

    const group = existingGroupTranslation
      ? await prisma.variantGroup.update({
          where: { id: existingGroupTranslation.variantGroupId },
          data: {
            type: groupDef.type,
            sortOrder: groupIndex,
          },
        })
      : await prisma.variantGroup.create({
          data: {
            type: groupDef.type,
            sortOrder: groupIndex,
          },
        });

    keepGroupIds.add(group.id);

    await prisma.variantGroupTranslation.deleteMany({
      where: { variantGroupId: group.id },
    });
    await prisma.variantGroupTranslation.createMany({
      data: makeSeedTranslations(
        { ...groupDef.en, slug: groupSlug },
        { ...groupDef.tr, slug: groupSlug },
      ).map((translation) => ({
        variantGroupId: group.id,
        locale: translation.locale,
        name: translation.name,
        slug: translation.slug ?? groupSlug,
      })),
    });

    const keepOptionIds = new Set<string>();
    const optionRecords: SeedOptionRecord[] = [];

    for (const [optionIndex, optionDef] of groupDef.options.entries()) {
      const optionSlug = makeSeedSlug('variant-option', optionDef.slug);

      const existingOption = await prisma.variantOption.findFirst({
        where: {
          variantGroupId: group.id,
          translations: {
            some: {
              locale: 'EN',
              slug: optionSlug,
            },
          },
        },
        select: {
          id: true,
        },
      });

      const option = existingOption
        ? await prisma.variantOption.update({
            where: { id: existingOption.id },
            data: {
              variantGroupId: group.id,
              colorCode: optionDef.colorCode ?? null,
              sortOrder: optionIndex,
            },
          })
        : await prisma.variantOption.create({
            data: {
              variantGroupId: group.id,
              colorCode: optionDef.colorCode ?? null,
              sortOrder: optionIndex,
            },
          });

      keepOptionIds.add(option.id);

      await prisma.variantOptionTranslation.deleteMany({
        where: { variantOptionId: option.id },
      });
      await prisma.variantOptionTranslation.createMany({
        data: makeSeedTranslations(
          { ...optionDef.en, slug: optionSlug },
          { ...optionDef.tr, slug: optionSlug },
        ).map((translation) => ({
          variantOptionId: option.id,
          locale: translation.locale,
          name: translation.name,
          slug: translation.slug ?? optionSlug,
        })),
      });

      await prisma.image.deleteMany({
        where: { variantOptionId: option.id },
      });
      if (optionDef.colorCode) {
        await prisma.image.create({
          data: {
            variantOptionId: option.id,
            url: makeImageUrl('catalog/variant-options', optionSlug, 160, 160),
            alt: `${optionDef.en.name} swatch`,
            width: 160,
            height: 160,
            fileType: 'IMAGE',
            sortOrder: 0,
            isPrimary: true,
          },
        });
      }

      optionRecords.push({
        id: option.id,
        slug: optionSlug,
        baseSlug: optionDef.slug,
        nameEn: optionDef.en.name,
        nameTr: optionDef.tr.name,
        colorCode: optionDef.colorCode ?? null,
      });
    }

    const obsoleteOptions = await prisma.variantOption.findMany({
      where: {
        variantGroupId: group.id,
        NOT: {
          id: {
            in: [...keepOptionIds],
          },
        },
      },
      select: {
        id: true,
      },
    });

    for (const obsoleteOption of obsoleteOptions) {
      await prisma.variantOption.delete({
        where: { id: obsoleteOption.id },
      });
    }

    records.set(groupDef.slug, {
      id: group.id,
      slug: groupSlug,
      baseSlug: groupDef.slug,
      type: groupDef.type,
      options: optionRecords,
    });
  }

  return { records, keepGroupIds };
}

function buildProductSeedPlans(targetCount: number): ProductSeedPlan[] {
  const segmentCounts = resolveSegmentCounts(targetCount);
  const segmentedPlans = {
    apparel: buildSegmentProductPlans('apparel', segmentCounts.apparel),
    footwear: buildSegmentProductPlans('footwear', segmentCounts.footwear),
    accessory: buildSegmentProductPlans('accessory', segmentCounts.accessory),
    digital: buildSegmentProductPlans('digital', segmentCounts.digital),
  };

  const plans = interleaveSegmentPlans(segmentedPlans);

  return plans.map((plan, index) => ({
    ...plan,
    productIndex: index,
    status: resolveProductStatus(index),
    storeSlugs: resolveStoreVisibility(index),
    imageCount: resolveImageCount(index, 1, plan.type === 'DIGITAL' ? 2 : 4),
  }));
}

function resolveSegmentCounts(total: number) {
  const baseCounts = {
    apparel: Math.floor((total * 12) / 18),
    footwear: Math.floor((total * 3) / 18),
    accessory: Math.floor((total * 2) / 18),
    digital: Math.floor(total / 18),
  };

  let assigned =
    baseCounts.apparel +
    baseCounts.footwear +
    baseCounts.accessory +
    baseCounts.digital;

  const order: Array<keyof typeof baseCounts> = [
    'accessory',
    'digital',
    'footwear',
    'apparel',
  ];

  let pointer = 0;
  while (assigned < total) {
    const key = order[pointer % order.length];
    baseCounts[key] += 1;
    assigned += 1;
    pointer += 1;
  }

  return baseCounts;
}

function buildSegmentProductPlans(
  segment: ProductFamilyDefinition['segment'],
  count: number,
): ProductSeedPlan[] {
  const families = PRODUCT_FAMILIES.filter((family) => family.segment === segment);
  const plans: ProductSeedPlan[] = [];
  let cycle = 0;

  while (plans.length < count) {
    for (const [seriesIndex, series] of CATALOG_SERIES.entries()) {
      for (const [familyIndex, family] of families.entries()) {
        if (plans.length >= count) {
          break;
        }

        const edition = cycle === 0 ? null : buildEditionLabel(cycle);
        const brandBaseSlug =
          family.brandPool[(familyIndex + seriesIndex + cycle) % family.brandPool.length];
        const dynamicTag = resolveSeriesTag(series.key);
        const tagBaseSlugs = [...new Set(compact([...family.tagSlugs, dynamicTag]))];
        const baseSlug = edition
          ? `${family.key}-${series.key}-${edition.slugSuffix}`
          : `${family.key}-${series.key}`;

        const enName = edition
          ? `${series.en} ${family.en.name} ${edition.suffixEn}`
          : `${series.en} ${family.en.name}`;
        const trName = edition
          ? `${series.tr} ${family.tr.name} ${edition.suffixTr}`
          : `${series.tr} ${family.tr.name}`;

        const enSlug = makeSeedSlug('product', baseSlug);
        const trSlug = enSlug;

        plans.push({
          enName,
          trName,
          enSlug,
          trSlug,
          type: family.type,
          status: 'DRAFT',
          family,
          brandBaseSlug,
          categoryBaseSlugs: family.categorySlugs,
          tagBaseSlugs,
          variantGroupSlugs: family.variantGroupSlugs,
          storeSlugs: ['helix-magaza'],
          imageCount: 1,
          productIndex: 0,
        });
      }
    }

    cycle += 1;
  }

  return plans;
}

function interleaveSegmentPlans(segmentedPlans: Record<string, ProductSeedPlan[]>): ProductSeedPlan[] {
  const queues = Object.values(segmentedPlans).map((plans) => [...plans]);
  const result: ProductSeedPlan[] = [];

  while (queues.some((queue) => queue.length > 0)) {
    for (const queue of queues) {
      const next = queue.shift();
      if (next) {
        result.push(next);
      }
    }
  }

  return result;
}

function resolveSeriesTag(seriesKey: string): string | null {
  switch (seriesKey) {
    case 'studio':
      return 'minimal';
    case 'urban':
      return 'casual';
    case 'essential':
      return 'all-season';
    case 'weekend':
      return 'weekend';
    case 'motion':
      return 'athleisure';
    case 'signature':
      return 'evening';
    case 'atelier':
      return 'tailored';
    case 'coastal':
      return 'high-summer';
    case 'midnight':
      return 'evening';
    case 'transit':
      return 'travel';
    default:
      return null;
  }
}

async function upsertProduct(input: {
  plan: ProductSeedPlan;
  stores: Map<(typeof CATALOG_STORE_SLUGS)[number], SeedStore>;
  brands: Map<string, SeedEntityRecord>;
  categories: Map<string, SeedEntityRecord>;
  tags: Map<string, SeedEntityRecord>;
  variantGroups: Map<string, SeedVariantGroupRecord>;
}): Promise<string> {
  const { plan, stores, brands, categories, tags, variantGroups } = input;
  const existingProductTranslation = await prisma.productTranslation.findFirst({
    where: {
      locale: 'EN',
      slug: plan.enSlug,
    },
    select: {
      productId: true,
    },
  });

  const brand = brands.get(plan.brandBaseSlug);
  if (!brand) {
    throw new Error(`Brand not found for seed family: ${plan.family.key}`);
  }

  const categoryIds = [...new Set(plan.categoryBaseSlugs)]
    .map((slug) => categories.get(slug)?.id ?? null)
    .filter((value): value is string => Boolean(value));

  const tagIds = [...new Set(plan.tagBaseSlugs)]
    .map((slug) => tags.get(slug)?.id ?? null)
    .filter((value): value is string => Boolean(value));

  const storeIds = plan.storeSlugs
    .map((slug) => stores.get(slug as (typeof CATALOG_STORE_SLUGS)[number])?.id ?? null)
    .filter((value): value is string => Boolean(value));

  if (categoryIds.length === 0) {
    throw new Error(`No categories resolved for ${plan.enSlug}`);
  }
  if (storeIds.length === 0) {
    throw new Error(`No stores resolved for ${plan.enSlug}`);
  }

  const product = existingProductTranslation
    ? await prisma.product.update({
        where: { id: existingProductTranslation.productId },
        data: {
          type: plan.type,
          status: plan.status,
          brandId: brand.id,
          googleTaxonomyId: null,
        },
      })
    : await prisma.product.create({
        data: {
          type: plan.type,
          status: plan.status,
          brandId: brand.id,
          googleTaxonomyId: null,
        },
      });

  await prisma.$transaction(async (tx) => {
    await tx.image.deleteMany({
      where: {
        OR: [
          {
            productId: product.id,
            productVariantId: null,
            productVariantGroupOptionId: null,
          },
          {
            productVariant: {
              productId: product.id,
            },
          },
          {
            productVariantGroupOption: {
              productVariantGroup: {
                productId: product.id,
              },
            },
          },
        ],
      },
    });

    await tx.productVariantValue.deleteMany({
      where: {
        productVariant: {
          productId: product.id,
        },
      },
    });
    await tx.productVariant.deleteMany({
      where: {
        productId: product.id,
      },
    });
    await tx.productVariantGroupOption.deleteMany({
      where: {
        productVariantGroup: {
          productId: product.id,
        },
      },
    });
    await tx.productVariantGroup.deleteMany({
      where: {
        productId: product.id,
      },
    });
    await tx.productCategory.deleteMany({
      where: { productId: product.id },
    });
    await tx.productTag.deleteMany({
      where: { productId: product.id },
    });
    await tx.productStore.deleteMany({
      where: { productId: product.id },
    });
    await tx.productTranslation.deleteMany({
      where: { productId: product.id },
    });

    await tx.productTranslation.createMany({
      data: buildProductTranslations(plan).map((translation) => ({
        productId: product.id,
        locale: translation.locale,
        name: translation.name,
        slug: translation.slug ?? plan.enSlug,
        shortDescription: translation.shortDescription ?? null,
        description: translation.description ?? null,
      })),
    });

    await tx.image.createMany({
      data: Array.from({ length: plan.imageCount }, (_, index) => ({
        productId: product.id,
        url: makeImageUrl(`catalog/products/${plan.enSlug}`, `product-${index + 1}`, 1200, 1200),
        alt: `${plan.enName} ${index + 1}`,
        width: 1200,
        height: 1200,
        fileType: 'IMAGE',
        sortOrder: index,
        isPrimary: index === 0,
      })),
    });

    await tx.productStore.createMany({
      data: storeIds.map((storeId) => ({
        productId: product.id,
        storeId,
        isVisible: true,
      })),
    });

    await tx.productCategory.createMany({
      data: categoryIds.map((categoryId, index) => ({
        productId: product.id,
        categoryId,
        sortOrder: index,
      })),
    });

    await tx.productTag.createMany({
      data: tagIds.map((tagId) => ({
        productId: product.id,
        tagId,
      })),
    });

    if (plan.variantGroupSlugs.length === 0) {
      return;
    }

    const seededVariantGroups = buildProductVariantGroups(plan, variantGroups);

    for (const [groupIndex, seededGroup] of seededVariantGroups.entries()) {
      const productVariantGroup = await tx.productVariantGroup.create({
        data: {
          productId: product.id,
          variantGroupId: seededGroup.group.id,
          sortOrder: groupIndex,
          displayMode: seededGroup.displayMode,
        },
      });

      for (const [optionIndex, option] of seededGroup.options.entries()) {
        const productVariantGroupOption = await tx.productVariantGroupOption.create({
          data: {
            productVariantGroupId: productVariantGroup.id,
            variantOptionId: option.id,
            sortOrder: optionIndex,
            colorCode: option.colorCode,
          },
        });

        if (seededGroup.group.baseSlug === 'color') {
          await tx.image.create({
            data: {
              productVariantGroupOptionId: productVariantGroupOption.id,
              url: makeImageUrl(
                `catalog/product-options/${plan.enSlug}`,
                option.baseSlug,
                240,
                240,
              ),
              alt: `${plan.enName} ${option.nameEn}`,
              width: 240,
              height: 240,
              fileType: 'IMAGE',
              sortOrder: 0,
              isPrimary: true,
            },
          });
        }
      }
    }

    const combinations = cartesianProduct(
      seededVariantGroups.map((group) => group.options),
    ).slice(0, 6);

    for (const [variantIndex, combination] of combinations.entries()) {
      const optionSlugs = combination.map((option) => option.baseSlug);
      const variant = await tx.productVariant.create({
        data: {
          productId: product.id,
          sku: buildSku(plan.enSlug, optionSlugs),
          barcode: buildEan13Barcode(`${plan.enSlug}:${optionSlugs.join('|')}`),
          isActive:
            plan.status === 'ARCHIVED' ? false : variantIndex % 5 !== 4,
          trackingStrategy: 'NONE',
          sortOrder: variantIndex,
        },
      });

      await tx.productVariantValue.createMany({
        data: combination.map((option) => ({
          productVariantId: variant.id,
          variantOptionId: option.id,
        })),
      });

      await tx.image.create({
        data: {
          productVariantId: variant.id,
          url: makeImageUrl(
            `catalog/product-variants/${plan.enSlug}`,
            optionSlugs.join('-'),
            960,
            960,
          ),
          alt: `${plan.enName} ${optionSlugs.join(' ')}`,
          width: 960,
          height: 960,
          fileType: 'IMAGE',
          sortOrder: 0,
          isPrimary: true,
        },
      });
    }
  });

  return product.id;
}

function buildProductTranslations(plan: ProductSeedPlan): SeedTranslationRecord[] {
  return makeSeedTranslations(
    {
      name: plan.enName,
      slug: plan.enSlug,
      shortDescription: plan.family.en.shortDescription,
      description: `${plan.family.en.description} Part of the ${plan.enName} edit.`,
    },
    {
      name: plan.trName,
      slug: plan.trSlug,
      shortDescription: plan.family.tr.shortDescription,
      description: `${plan.family.tr.description} ${plan.trName} seçkisi içinde konumlanır.`,
    },
  );
}

function buildProductVariantGroups(
  plan: ProductSeedPlan,
  variantGroups: Map<string, SeedVariantGroupRecord>,
): Array<{
  group: SeedVariantGroupRecord;
  displayMode: VariantGroupDisplayMode | null;
  options: SeedOptionRecord[];
}> {
  return plan.variantGroupSlugs.map((groupSlug, groupIndex) => {
    const group = variantGroups.get(groupSlug);
    if (!group) {
      throw new Error(`Variant group not found for ${plan.enSlug}: ${groupSlug}`);
    }

    const offset = hashToInt(`${plan.enSlug}:${groupSlug}`) % group.options.length;
    let count = 2;

    if (groupSlug === 'color') {
      count = plan.family.segment === 'accessory' && !plan.variantGroupSlugs.includes('accessory-size')
        ? 3
        : 2 + (plan.productIndex % 2);
    } else if (groupSlug === 'size') {
      count = 2;
    } else if (groupSlug === 'shoe-size') {
      count = 3;
    } else if (groupSlug === 'accessory-size') {
      count = 2;
    }

    const options = rotateSlice(group.options, offset, count);
    return {
      group,
      displayMode: resolveDisplayMode(group.baseSlug, groupIndex),
      options,
    };
  });
}

function resolveDisplayMode(
  groupSlug: string,
  groupIndex: number,
): VariantGroupDisplayMode | null {
  if (groupSlug === 'color') {
    return groupIndex % 2 === 0 ? 'IMAGE_GRID' : 'BADGE';
  }
  return 'SELECT';
}

async function cleanupSeedProducts(keepProductIds: Set<string>) {
  const seedProducts = await prisma.productTranslation.findMany({
    where: {
      locale: 'EN',
      slug: {
        startsWith: CATALOG_PRODUCT_SLUG_PREFIX,
      },
    },
    select: {
      productId: true,
    },
  });

  const obsoleteIds = [...new Set(seedProducts.map((row) => row.productId))].filter(
    (productId) => !keepProductIds.has(productId),
  );

  for (const obsoleteId of obsoleteIds) {
    await prisma.product.delete({
      where: {
        id: obsoleteId,
      },
    });
  }
}

async function cleanupSeedBrands(keepSlugs: Set<string>) {
  const obsoleteBrands = await prisma.brand.findMany({
    where: {
      slug: {
        startsWith: CATALOG_BRAND_SLUG_PREFIX,
      },
      NOT: {
        slug: {
          in: [...keepSlugs],
        },
      },
    },
    select: {
      id: true,
    },
  });

  for (const brand of obsoleteBrands) {
    await prisma.brand.delete({
      where: { id: brand.id },
    });
  }
}

async function cleanupSeedCategories(keepSlugs: Set<string>) {
  const obsoleteCategories = await prisma.category.findMany({
    where: {
      slug: {
        startsWith: CATALOG_CATEGORY_SLUG_PREFIX,
      },
      NOT: {
        slug: {
          in: [...keepSlugs],
        },
      },
    },
    select: {
      id: true,
      depth: true,
    },
    orderBy: {
      depth: 'desc',
    },
  });

  for (const category of obsoleteCategories) {
    await prisma.category.delete({
      where: {
        id: category.id,
      },
    });
  }
}

async function cleanupSeedTagGroups(keepGroupSlugs: Set<string>) {
  const obsoleteGroups = await prisma.tagGroup.findMany({
    where: {
      slug: {
        startsWith: CATALOG_TAG_GROUP_SLUG_PREFIX,
      },
      NOT: {
        slug: {
          in: [...keepGroupSlugs],
        },
      },
    },
    select: {
      id: true,
    },
  });

  for (const group of obsoleteGroups) {
    await prisma.tagGroup.delete({
      where: { id: group.id },
    });
  }
}

async function cleanupSeedVariantGroups(keepGroupIds: Set<string>) {
  const seedGroups = await prisma.variantGroup.findMany({
    where: {
      translations: {
        some: {
          locale: 'EN',
          slug: {
            startsWith: CATALOG_VARIANT_GROUP_SLUG_PREFIX,
          },
        },
      },
    },
    select: {
      id: true,
    },
  });

  const obsoleteIds = seedGroups
    .map((group) => group.id)
    .filter((groupId) => !keepGroupIds.has(groupId));

  for (const groupId of obsoleteIds) {
    await prisma.variantGroup.delete({
      where: { id: groupId },
    });
  }
}

seedCatalogProducts()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
