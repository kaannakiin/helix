import { faker } from '@faker-js/faker';
import type { Locale, ProductStatus, ProductType } from '../../browser.js';
import { prisma } from '../../prisma.js';

const BRANDS = [
  {
    slug: 'nike',
    websiteUrl: 'https://www.nike.com',
    en: { name: 'Nike', description: 'Just Do It' },
    tr: { name: 'Nike', description: 'Just Do It' },
  },
  {
    slug: 'adidas',
    websiteUrl: 'https://www.adidas.com',
    en: { name: 'Adidas', description: 'Impossible Is Nothing' },
    tr: { name: 'Adidas', description: 'İmkansız Diye Bir Şey Yok' },
  },
  {
    slug: 'puma',
    websiteUrl: 'https://www.puma.com',
    en: { name: 'Puma', description: 'Forever Faster' },
    tr: { name: 'Puma', description: 'Sonsuza Dek Hızlı' },
  },
  {
    slug: 'zara',
    websiteUrl: 'https://www.zara.com',
    en: { name: 'Zara', description: 'Fashion for all' },
    tr: { name: 'Zara', description: 'Herkes için moda' },
  },
  {
    slug: 'hm',
    websiteUrl: 'https://www.hm.com',
    en: { name: 'H&M', description: 'Fashion and quality at the best price' },
    tr: { name: 'H&M', description: 'En iyi fiyata moda ve kalite' },
  },
  {
    slug: 'uniqlo',
    websiteUrl: 'https://www.uniqlo.com',
    en: { name: 'Uniqlo', description: 'Made for all' },
    tr: { name: 'Uniqlo', description: 'Herkes için üretildi' },
  },
];

const CATEGORIES_TREE = [
  {
    slug: 'clothing',
    en: { name: 'Clothing', description: 'All clothing items' },
    tr: { name: 'Giyim', description: 'Tüm giyim ürünleri' },
    children: [
      {
        slug: 'mens-clothing',
        en: { name: "Men's Clothing", description: 'Clothing for men' },
        tr: { name: 'Erkek Giyim', description: 'Erkekler için giyim' },
        children: [
          {
            slug: 'mens-tshirts',
            en: { name: "Men's T-Shirts" },
            tr: { name: 'Erkek Tişörtler' },
          },
          {
            slug: 'mens-pants',
            en: { name: "Men's Pants" },
            tr: { name: 'Erkek Pantolonlar' },
          },
          {
            slug: 'mens-jackets',
            en: { name: "Men's Jackets" },
            tr: { name: 'Erkek Ceketler' },
          },
        ],
      },
      {
        slug: 'womens-clothing',
        en: { name: "Women's Clothing", description: 'Clothing for women' },
        tr: { name: 'Kadın Giyim', description: 'Kadınlar için giyim' },
        children: [
          {
            slug: 'womens-tshirts',
            en: { name: "Women's T-Shirts" },
            tr: { name: 'Kadın Tişörtler' },
          },
          {
            slug: 'womens-dresses',
            en: { name: "Women's Dresses" },
            tr: { name: 'Kadın Elbiseler' },
          },
          {
            slug: 'womens-jackets',
            en: { name: "Women's Jackets" },
            tr: { name: 'Kadın Ceketler' },
          },
        ],
      },
    ],
  },
  {
    slug: 'footwear',
    en: { name: 'Footwear', description: 'All shoes and boots' },
    tr: { name: 'Ayakkabı', description: 'Tüm ayakkabılar ve botlar' },
    children: [
      {
        slug: 'sneakers',
        en: { name: 'Sneakers' },
        tr: { name: 'Spor Ayakkabılar' },
      },
      {
        slug: 'boots',
        en: { name: 'Boots' },
        tr: { name: 'Botlar' },
      },
      {
        slug: 'sandals',
        en: { name: 'Sandals' },
        tr: { name: 'Sandaletler' },
      },
    ],
  },
  {
    slug: 'accessories',
    en: { name: 'Accessories', description: 'Bags, hats, and more' },
    tr: {
      name: 'Aksesuarlar',
      description: 'Çantalar, şapkalar ve daha fazlası',
    },
    children: [
      {
        slug: 'bags',
        en: { name: 'Bags' },
        tr: { name: 'Çantalar' },
      },
      {
        slug: 'hats',
        en: { name: 'Hats' },
        tr: { name: 'Şapkalar' },
      },
    ],
  },
];

const TAG_GROUPS = [
  {
    slug: 'season',
    en: { name: 'Season', description: 'Seasonal collections' },
    tr: { name: 'Sezon', description: 'Sezonluk koleksiyonlar' },
    tags: [
      {
        slug: 'spring-summer',
        en: { name: 'Spring/Summer' },
        tr: { name: 'İlkbahar/Yaz' },
      },
      {
        slug: 'fall-winter',
        en: { name: 'Fall/Winter' },
        tr: { name: 'Sonbahar/Kış' },
      },
      {
        slug: 'all-season',
        en: { name: 'All Season' },
        tr: { name: 'Tüm Sezonlar' },
      },
    ],
  },
  {
    slug: 'material',
    en: { name: 'Material', description: 'Product material types' },
    tr: { name: 'Materyal', description: 'Ürün materyal türleri' },
    tags: [
      { slug: 'cotton', en: { name: 'Cotton' }, tr: { name: 'Pamuk' } },
      {
        slug: 'polyester',
        en: { name: 'Polyester' },
        tr: { name: 'Polyester' },
      },
      { slug: 'leather', en: { name: 'Leather' }, tr: { name: 'Deri' } },
      { slug: 'wool', en: { name: 'Wool' }, tr: { name: 'Yün' } },
      { slug: 'denim', en: { name: 'Denim' }, tr: { name: 'Kot' } },
    ],
  },
  {
    slug: 'style',
    en: { name: 'Style', description: 'Fashion style' },
    tr: { name: 'Stil', description: 'Moda stili' },
    tags: [
      { slug: 'casual', en: { name: 'Casual' }, tr: { name: 'Günlük' } },
      { slug: 'formal', en: { name: 'Formal' }, tr: { name: 'Resmi' } },
      { slug: 'sporty', en: { name: 'Sporty' }, tr: { name: 'Sportif' } },
      { slug: 'vintage', en: { name: 'Vintage' }, tr: { name: 'Vintage' } },
    ],
  },
  {
    slug: 'feature',
    en: { name: 'Feature', description: 'Product features' },
    tr: { name: 'Özellik', description: 'Ürün özellikleri' },
    tags: [
      {
        slug: 'waterproof',
        en: { name: 'Waterproof' },
        tr: { name: 'Su Geçirmez' },
      },
      {
        slug: 'breathable',
        en: { name: 'Breathable' },
        tr: { name: 'Nefes Alabilir' },
      },
      {
        slug: 'eco-friendly',
        en: { name: 'Eco-Friendly' },
        tr: { name: 'Çevre Dostu' },
      },
    ],
  },
];

const VARIANT_GROUPS = [
  {
    en: { name: 'Color', slug: 'color' },
    tr: { name: 'Renk', slug: 'renk' },
    options: [
      {
        colorCode: '#000000',
        en: { name: 'Black', slug: 'black' },
        tr: { name: 'Siyah', slug: 'siyah' },
      },
      {
        colorCode: '#FFFFFF',
        en: { name: 'White', slug: 'white' },
        tr: { name: 'Beyaz', slug: 'beyaz' },
      },
      {
        colorCode: '#FF0000',
        en: { name: 'Red', slug: 'red' },
        tr: { name: 'Kırmızı', slug: 'kirmizi' },
      },
      {
        colorCode: '#0000FF',
        en: { name: 'Blue', slug: 'blue' },
        tr: { name: 'Mavi', slug: 'mavi' },
      },
      {
        colorCode: '#008000',
        en: { name: 'Green', slug: 'green' },
        tr: { name: 'Yeşil', slug: 'yesil' },
      },
      {
        colorCode: '#808080',
        en: { name: 'Gray', slug: 'gray' },
        tr: { name: 'Gri', slug: 'gri' },
      },
      {
        colorCode: '#000080',
        en: { name: 'Navy', slug: 'navy' },
        tr: { name: 'Lacivert', slug: 'lacivert' },
      },
      {
        colorCode: '#F5F5DC',
        en: { name: 'Beige', slug: 'beige' },
        tr: { name: 'Bej', slug: 'bej' },
      },
    ],
  },
  {
    en: { name: 'Size', slug: 'size' },
    tr: { name: 'Beden', slug: 'beden' },
    options: [
      { en: { name: 'XS', slug: 'xs' }, tr: { name: 'XS', slug: 'xs' } },
      { en: { name: 'S', slug: 's' }, tr: { name: 'S', slug: 's' } },
      { en: { name: 'M', slug: 'm' }, tr: { name: 'M', slug: 'm' } },
      { en: { name: 'L', slug: 'l' }, tr: { name: 'L', slug: 'l' } },
      { en: { name: 'XL', slug: 'xl' }, tr: { name: 'XL', slug: 'xl' } },
      { en: { name: 'XXL', slug: 'xxl' }, tr: { name: 'XXL', slug: 'xxl' } },
    ],
  },
  {
    en: { name: 'Shoe Size', slug: 'shoe-size' },
    tr: { name: 'Ayakkabı Numarası', slug: 'ayakkabi-numarasi' },
    options: [
      { en: { name: '38', slug: '38' }, tr: { name: '38', slug: '38' } },
      { en: { name: '39', slug: '39' }, tr: { name: '39', slug: '39' } },
      { en: { name: '40', slug: '40' }, tr: { name: '40', slug: '40' } },
      { en: { name: '41', slug: '41' }, tr: { name: '41', slug: '41' } },
      { en: { name: '42', slug: '42' }, tr: { name: '42', slug: '42' } },
      { en: { name: '43', slug: '43' }, tr: { name: '43', slug: '43' } },
      { en: { name: '44', slug: '44' }, tr: { name: '44', slug: '44' } },
    ],
  },
];

const PRODUCT_TEMPLATES = [
  {
    en: {
      name: 'Classic Crew Neck T-Shirt',
      slug: 'classic-crew-neck-tshirt',
      shortDescription: 'Everyday essential crew neck tee',
    },
    tr: {
      name: 'Klasik Bisiklet Yaka Tişört',
      slug: 'klasik-bisiklet-yaka-tisort',
      shortDescription: 'Günlük bisiklet yaka tişört',
    },
    type: 'PHYSICAL' as ProductType,
    categories: ['mens-tshirts'],
    tagSlugs: ['cotton', 'casual', 'all-season'],
    variantGroups: ['color', 'size'],
  },
  {
    en: {
      name: 'V-Neck Slim Fit T-Shirt',
      slug: 'v-neck-slim-fit-tshirt',
      shortDescription: 'Modern slim fit v-neck tee',
    },
    tr: {
      name: 'V Yaka Slim Fit Tişört',
      slug: 'v-yaka-slim-fit-tisort',
      shortDescription: 'Modern slim fit v yaka tişört',
    },
    type: 'PHYSICAL' as ProductType,
    categories: ['mens-tshirts'],
    tagSlugs: ['cotton', 'casual', 'spring-summer'],
    variantGroups: ['color', 'size'],
  },
  {
    en: {
      name: 'Oversized Graphic Tee',
      slug: 'oversized-graphic-tee',
      shortDescription: 'Trendy oversized graphic t-shirt',
    },
    tr: {
      name: 'Oversize Baskılı Tişört',
      slug: 'oversize-baskili-tisort',
      shortDescription: 'Trend oversize baskılı tişört',
    },
    type: 'PHYSICAL' as ProductType,
    categories: ['womens-tshirts'],
    tagSlugs: ['cotton', 'casual', 'spring-summer'],
    variantGroups: ['color', 'size'],
  },

  {
    en: {
      name: 'Slim Fit Chino Pants',
      slug: 'slim-fit-chino-pants',
      shortDescription: 'Comfortable slim fit chinos',
    },
    tr: {
      name: 'Slim Fit Chino Pantolon',
      slug: 'slim-fit-chino-pantolon',
      shortDescription: 'Rahat slim fit chino pantolon',
    },
    type: 'PHYSICAL' as ProductType,
    categories: ['mens-pants'],
    tagSlugs: ['cotton', 'casual', 'all-season'],
    variantGroups: ['color', 'size'],
  },
  {
    en: {
      name: 'Classic Denim Jeans',
      slug: 'classic-denim-jeans',
      shortDescription: 'Timeless straight fit denim jeans',
    },
    tr: {
      name: 'Klasik Denim Jean',
      slug: 'klasik-denim-jean',
      shortDescription: 'Zamansız düz kesim denim jean',
    },
    type: 'PHYSICAL' as ProductType,
    categories: ['mens-pants'],
    tagSlugs: ['denim', 'casual', 'all-season'],
    variantGroups: ['color', 'size'],
  },

  {
    en: {
      name: 'Floral Midi Dress',
      slug: 'floral-midi-dress',
      shortDescription: 'Elegant floral print midi dress',
    },
    tr: {
      name: 'Çiçekli Midi Elbise',
      slug: 'cicekli-midi-elbise',
      shortDescription: 'Şık çiçek desenli midi elbise',
    },
    type: 'PHYSICAL' as ProductType,
    categories: ['womens-dresses'],
    tagSlugs: ['polyester', 'casual', 'spring-summer'],
    variantGroups: ['color', 'size'],
  },
  {
    en: {
      name: 'Evening Satin Dress',
      slug: 'evening-satin-dress',
      shortDescription: 'Luxurious satin evening dress',
    },
    tr: {
      name: 'Saten Gece Elbisesi',
      slug: 'saten-gece-elbisesi',
      shortDescription: 'Lüks saten gece elbisesi',
    },
    type: 'PHYSICAL' as ProductType,
    categories: ['womens-dresses'],
    tagSlugs: ['polyester', 'formal', 'fall-winter'],
    variantGroups: ['color', 'size'],
  },

  {
    en: {
      name: 'Waterproof Windbreaker',
      slug: 'waterproof-windbreaker',
      shortDescription: 'Lightweight waterproof windbreaker jacket',
    },
    tr: {
      name: 'Su Geçirmez Rüzgarlık',
      slug: 'su-gecirmez-ruzgarlik',
      shortDescription: 'Hafif su geçirmez rüzgarlık ceket',
    },
    type: 'PHYSICAL' as ProductType,
    categories: ['mens-jackets'],
    tagSlugs: ['polyester', 'sporty', 'waterproof', 'spring-summer'],
    variantGroups: ['color', 'size'],
  },
  {
    en: {
      name: 'Leather Biker Jacket',
      slug: 'leather-biker-jacket',
      shortDescription: 'Classic leather biker jacket',
    },
    tr: {
      name: 'Deri Biker Ceket',
      slug: 'deri-biker-ceket',
      shortDescription: 'Klasik deri biker ceket',
    },
    type: 'PHYSICAL' as ProductType,
    categories: ['womens-jackets'],
    tagSlugs: ['leather', 'casual', 'fall-winter'],
    variantGroups: ['color', 'size'],
  },
  {
    en: {
      name: 'Wool Overcoat',
      slug: 'wool-overcoat',
      shortDescription: 'Premium wool blend overcoat',
    },
    tr: {
      name: 'Yün Palto',
      slug: 'yun-palto',
      shortDescription: 'Premium yün karışım palto',
    },
    type: 'PHYSICAL' as ProductType,
    categories: ['mens-jackets'],
    tagSlugs: ['wool', 'formal', 'fall-winter'],
    variantGroups: ['color', 'size'],
  },

  {
    en: {
      name: 'Running Performance Shoes',
      slug: 'running-performance-shoes',
      shortDescription: 'High-performance running shoes',
    },
    tr: {
      name: 'Koşu Performans Ayakkabısı',
      slug: 'kosu-performans-ayakkabisi',
      shortDescription: 'Yüksek performanslı koşu ayakkabısı',
    },
    type: 'PHYSICAL' as ProductType,
    categories: ['sneakers'],
    tagSlugs: ['polyester', 'sporty', 'breathable'],
    variantGroups: ['color', 'shoe-size'],
  },
  {
    en: {
      name: 'Classic Canvas Sneakers',
      slug: 'classic-canvas-sneakers',
      shortDescription: 'Everyday canvas sneakers',
    },
    tr: {
      name: 'Klasik Kanvas Spor Ayakkabı',
      slug: 'klasik-kanvas-spor-ayakkabi',
      shortDescription: 'Günlük kanvas spor ayakkabı',
    },
    type: 'PHYSICAL' as ProductType,
    categories: ['sneakers'],
    tagSlugs: ['cotton', 'casual', 'all-season'],
    variantGroups: ['color', 'shoe-size'],
  },

  {
    en: {
      name: 'Chelsea Leather Boots',
      slug: 'chelsea-leather-boots',
      shortDescription: 'Classic Chelsea style leather boots',
    },
    tr: {
      name: 'Chelsea Deri Bot',
      slug: 'chelsea-deri-bot',
      shortDescription: 'Klasik Chelsea tarzı deri bot',
    },
    type: 'PHYSICAL' as ProductType,
    categories: ['boots'],
    tagSlugs: ['leather', 'casual', 'fall-winter'],
    variantGroups: ['color', 'shoe-size'],
  },

  {
    en: {
      name: 'Comfort Slide Sandals',
      slug: 'comfort-slide-sandals',
      shortDescription: 'Cushioned slide sandals for everyday comfort',
    },
    tr: {
      name: 'Konfor Terlik Sandalet',
      slug: 'konfor-terlik-sandalet',
      shortDescription: 'Günlük konfor için yastıklı terlik sandalet',
    },
    type: 'PHYSICAL' as ProductType,
    categories: ['sandals'],
    tagSlugs: ['polyester', 'casual', 'spring-summer'],
    variantGroups: ['color', 'shoe-size'],
  },

  {
    en: {
      name: 'Leather Tote Bag',
      slug: 'leather-tote-bag',
      shortDescription: 'Spacious leather tote bag',
    },
    tr: {
      name: 'Deri Tote Çanta',
      slug: 'deri-tote-canta',
      shortDescription: 'Geniş deri tote çanta',
    },
    type: 'PHYSICAL' as ProductType,
    categories: ['bags'],
    tagSlugs: ['leather', 'casual', 'all-season'],
    variantGroups: ['color'],
  },
  {
    en: {
      name: 'Sport Backpack',
      slug: 'sport-backpack',
      shortDescription: 'Durable sport backpack with multiple compartments',
    },
    tr: {
      name: 'Spor Sırt Çantası',
      slug: 'spor-sirt-cantasi',
      shortDescription: 'Çok bölmeli dayanıklı spor sırt çantası',
    },
    type: 'PHYSICAL' as ProductType,
    categories: ['bags'],
    tagSlugs: ['polyester', 'sporty', 'waterproof'],
    variantGroups: ['color'],
  },

  {
    en: {
      name: 'Baseball Cap',
      slug: 'baseball-cap',
      shortDescription: 'Classic adjustable baseball cap',
    },
    tr: {
      name: 'Beyzbol Şapkası',
      slug: 'beyzbol-sapkasi',
      shortDescription: 'Klasik ayarlanabilir beyzbol şapkası',
    },
    type: 'PHYSICAL' as ProductType,
    categories: ['hats'],
    tagSlugs: ['cotton', 'sporty', 'spring-summer'],
    variantGroups: ['color'],
  },
  {
    en: {
      name: 'Wool Beanie',
      slug: 'wool-beanie',
      shortDescription: 'Warm wool knit beanie',
    },
    tr: {
      name: 'Yün Bere',
      slug: 'yun-bere',
      shortDescription: 'Sıcak yün örgü bere',
    },
    type: 'PHYSICAL' as ProductType,
    categories: ['hats'],
    tagSlugs: ['wool', 'casual', 'fall-winter'],
    variantGroups: ['color'],
  },

  {
    en: {
      name: 'Style Guide eBook',
      slug: 'style-guide-ebook',
      shortDescription: 'Complete digital style guide',
    },
    tr: {
      name: 'Stil Rehberi eKitap',
      slug: 'stil-rehberi-ekitap',
      shortDescription: 'Kapsamlı dijital stil rehberi',
    },
    type: 'DIGITAL' as ProductType,
    categories: ['accessories'],
    tagSlugs: ['casual', 'all-season'],
    variantGroups: [],
  },
];

function fakeImageUrl(width = 640, height = 480): string {
  return faker.image.url({ width, height });
}

function translations(
  en: {
    name: string;
    description?: string;
    slug?: string;
    shortDescription?: string;
  },
  tr: {
    name: string;
    description?: string;
    slug?: string;
    shortDescription?: string;
  }
) {
  const result: Array<{
    locale: Locale;
    name: string;
    description?: string;
    slug?: string;
    shortDescription?: string;
  }> = [];

  result.push({ locale: 'EN' as Locale, ...en });
  result.push({ locale: 'TR' as Locale, ...tr });

  return result;
}

async function seedBrands() {
  console.log('Seeding brands...');
  const brandIds: Record<string, string> = {};

  for (let i = 0; i < BRANDS.length; i++) {
    const b = BRANDS[i];
    const brand = await prisma.brand.upsert({
      where: { slug: b.slug },
      update: {},
      create: {
        slug: b.slug,
        websiteUrl: b.websiteUrl,
        isActive: true,
        sortOrder: i,
        translations: {
          create: translations(b.en, b.tr),
        },
        images: {
          create: {
            url: fakeImageUrl(200, 200),
            alt: `${b.en.name} logo`,
            width: 200,
            height: 200,
            isPrimary: true,
            sortOrder: 0,
          },
        },
      },
    });
    brandIds[b.slug] = brand.id;
  }

  console.log(`  Created ${BRANDS.length} brands`);
  return brandIds;
}

async function seedCategories() {
  console.log('Seeding categories...');
  const categoryIds: Record<string, string> = {};

  interface CategoryNode {
    slug: string;
    en: { name: string; description?: string };
    tr: { name: string; description?: string };
    children?: CategoryNode[];
  }

  async function createCategory(
    node: CategoryNode,
    parentId: string | null,
    depth: number,
    sortOrder: number
  ) {
    const category = await prisma.category.upsert({
      where: { slug: node.slug },
      update: {},
      create: {
        slug: node.slug,
        parentId: parentId,
        depth: depth,
        isActive: true,
        sortOrder: sortOrder,
        translations: {
          create: translations(node.en, node.tr),
        },
        images: {
          create: {
            url: fakeImageUrl(400, 300),
            alt: node.en.name,
            width: 400,
            height: 300,
            isPrimary: true,
            sortOrder: 0,
          },
        },
      },
    });

    categoryIds[node.slug] = category.id;

    if (node.children) {
      for (let i = 0; i < node.children.length; i++) {
        await createCategory(node.children[i], category.id, depth + 1, i);
      }
    }
  }

  for (let i = 0; i < CATEGORIES_TREE.length; i++) {
    await createCategory(CATEGORIES_TREE[i], null, 0, i);
  }

  const totalCount = Object.keys(categoryIds).length;
  console.log(`  Created ${totalCount} categories`);
  return categoryIds;
}

async function seedTagGroups() {
  console.log('Seeding tag groups...');
  const tagIds: Record<string, string> = {};

  for (let i = 0; i < TAG_GROUPS.length; i++) {
    const tg = TAG_GROUPS[i];
    const tagGroup = await prisma.tagGroup.upsert({
      where: { slug: tg.slug },
      update: {},
      create: {
        slug: tg.slug,
        isActive: true,
        sortOrder: i,
        translations: {
          create: translations(tg.en, tg.tr),
        },
        tags: {
          create: tg.tags.map((t, j) => ({
            slug: t.slug,
            isActive: true,
            sortOrder: j,
            translations: {
              create: translations(t.en, t.tr),
            },
          })),
        },
      },
      include: { tags: true },
    });

    for (const tag of tagGroup.tags) {
      tagIds[tag.slug] = tag.id;
    }
  }

  console.log(
    `  Created ${TAG_GROUPS.length} tag groups with ${
      Object.keys(tagIds).length
    } tags`
  );
  return tagIds;
}

async function seedVariantGroups() {
  console.log('Seeding variant groups...');

  const variantGroupMap: Record<
    string,
    { groupId: string; options: Array<{ id: string; enSlug: string }> }
  > = {};

  for (let i = 0; i < VARIANT_GROUPS.length; i++) {
    const vg = VARIANT_GROUPS[i];

    const group = await prisma.variantGroup.create({
      data: {
        sortOrder: i,
        translations: {
          create: [
            { locale: 'EN' as Locale, name: vg.en.name, slug: vg.en.slug },
            { locale: 'TR' as Locale, name: vg.tr.name, slug: vg.tr.slug },
          ],
        },
        options: {
          create: vg.options.map((opt, j) => ({
            colorCode:
              'colorCode' in opt
                ? (opt as { colorCode?: string }).colorCode
                : undefined,
            sortOrder: j,
            translations: {
              create: [
                {
                  locale: 'EN' as Locale,
                  name: opt.en.name,
                  slug: opt.en.slug,
                },
                {
                  locale: 'TR' as Locale,
                  name: opt.tr.name,
                  slug: opt.tr.slug,
                },
              ],
            },
          })),
        },
      },
      include: {
        options: {
          include: { translations: true },
          orderBy: { sortOrder: 'asc' },
        },
        translations: true,
      },
    });

    variantGroupMap[vg.en.slug] = {
      groupId: group.id,
      options: group.options.map((opt) => ({
        id: opt.id,
        enSlug: opt.translations.find((t) => t.locale === 'EN')?.slug ?? '',
      })),
    };
  }

  console.log(`  Created ${VARIANT_GROUPS.length} variant groups`);
  return variantGroupMap;
}

async function seedProducts(
  brandIds: Record<string, string>,
  categoryIds: Record<string, string>,
  tagIds: Record<string, string>,
  variantGroupMap: Record<
    string,
    { groupId: string; options: Array<{ id: string; enSlug: string }> }
  >
) {
  console.log('Seeding products...');

  const brandSlugs = Object.keys(brandIds);
  const statuses: ProductStatus[] = [
    'ACTIVE',
    'ACTIVE',
    'ACTIVE',
    'DRAFT',
    'ARCHIVED',
  ];

  for (let i = 0; i < PRODUCT_TEMPLATES.length; i++) {
    const tmpl = PRODUCT_TEMPLATES[i];
    const status = faker.helpers.arrayElement(statuses);
    const brandSlug = faker.helpers.arrayElement(brandSlugs);

    const product = await prisma.product.create({
      data: {
        type: tmpl.type,
        status: status,
        brandId: brandIds[brandSlug],
        translations: {
          create: [
            {
              locale: 'EN' as Locale,
              name: tmpl.en.name,
              slug: tmpl.en.slug,
              shortDescription: tmpl.en.shortDescription,
              description: faker.commerce.productDescription(),
            },
            {
              locale: 'TR' as Locale,
              name: tmpl.tr.name,
              slug: tmpl.tr.slug,
              shortDescription: tmpl.tr.shortDescription,
              description: faker.commerce.productDescription(),
            },
          ],
        },
        images: {
          create: Array.from(
            { length: faker.number.int({ min: 1, max: 4 }) },
            (_, idx) => ({
              url: fakeImageUrl(800, 800),
              alt: `${tmpl.en.name} image ${idx + 1}`,
              width: 800,
              height: 800,
              isPrimary: idx === 0,
              sortOrder: idx,
            })
          ),
        },
      },
    });

    for (const catSlug of tmpl.categories) {
      if (categoryIds[catSlug]) {
        await prisma.productCategory.create({
          data: {
            productId: product.id,
            categoryId: categoryIds[catSlug],
            sortOrder: 0,
          },
        });
      }
    }

    for (const tagSlug of tmpl.tagSlugs) {
      if (tagIds[tagSlug]) {
        await prisma.productTag.create({
          data: {
            productId: product.id,
            tagId: tagIds[tagSlug],
          },
        });
      }
    }

    if (tmpl.variantGroups.length > 0) {
      const groupsForProduct: Array<{
        groupId: string;
        options: Array<{ id: string; enSlug: string }>;
      }> = [];

      for (let g = 0; g < tmpl.variantGroups.length; g++) {
        const groupSlug = tmpl.variantGroups[g];
        const groupData = variantGroupMap[groupSlug];
        if (!groupData) continue;

        await prisma.productVariantGroup.create({
          data: {
            productId: product.id,
            variantGroupId: groupData.groupId,
            sortOrder: g,
          },
        });

        const optionCount = Math.min(
          groupData.options.length,
          faker.number.int({ min: 3, max: 5 })
        );
        const selectedOptions = faker.helpers
          .shuffle([...groupData.options])
          .slice(0, optionCount);

        groupsForProduct.push({
          groupId: groupData.groupId,
          options: selectedOptions,
        });
      }

      if (groupsForProduct.length > 0) {
        const optionCombinations = cartesianProduct(
          groupsForProduct.map((g) => g.options)
        );

        const limitedCombinations = optionCombinations.slice(0, 20);

        for (let v = 0; v < limitedCombinations.length; v++) {
          const combo = limitedCombinations[v];
          const skuSuffix = combo.map((o) => o.enSlug.toUpperCase()).join('-');
          const sku = `${tmpl.en.slug
            .toUpperCase()
            .replace(/-/g, '')}-${skuSuffix}`.slice(0, 50);

          await prisma.productVariant.create({
            data: {
              productId: product.id,
              sku: sku,
              barcode: faker.string.numeric(13),
              isActive: faker.datatype.boolean({ probability: 0.9 }),
              sortOrder: v,
              optionValues: {
                create: combo.map((opt) => ({
                  variantOptionId: opt.id,
                })),
              },
            },
          });
        }
      }
    }

    console.log(
      `  [${i + 1}/${PRODUCT_TEMPLATES.length}] ${tmpl.en.name} (${status})`
    );
  }

  console.log(`  Created ${PRODUCT_TEMPLATES.length} products with variants`);
}

function cartesianProduct<T>(arrays: T[][]): T[][] {
  if (arrays.length === 0) return [[]];
  return arrays.reduce<T[][]>(
    (acc, curr) => acc.flatMap((a) => curr.map((c) => [...a, c])),
    [[]]
  );
}

async function seedProductData() {
  console.log('=== Starting product data seed ===\n');

  const brandIds = await seedBrands();
  const categoryIds = await seedCategories();
  const tagIds = await seedTagGroups();
  const variantGroupMap = await seedVariantGroups();
  await seedProducts(brandIds, categoryIds, tagIds, variantGroupMap);

  console.log('\n=== Product data seed completed! ===');
}

seedProductData()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
