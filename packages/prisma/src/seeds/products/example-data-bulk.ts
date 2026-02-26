import { faker } from '@faker-js/faker';
import * as slugifyModule from 'slugify';
import type { Locale } from '../../browser.js';
import { prisma } from '../../prisma.js';

const slugifyLib =
  (slugifyModule as unknown as { default?: (s: string, o?: object) => string })
    .default ??
  (slugifyModule as unknown as (s: string, o?: object) => string);

function slugify(input: string): string {
  return slugifyLib(input, { lower: true, strict: true });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fakeImageUrl(width = 640, height = 480): string {
  return faker.image.url({ width, height });
}

function translations(
  en: { name: string; description?: string },
  tr: { name: string; description?: string }
) {
  return [
    { locale: 'EN' as Locale, ...en },
    { locale: 'TR' as Locale, ...tr },
  ];
}

// ─── Brand Seed ───────────────────────────────────────────────────────────────

async function seedBulkBrands() {
  console.log('Seeding bulk brands...');
  let created = 0;

  for (let i = 0; i < 100; i++) {
    const enName = faker.company.name();
    const trName = faker.company.name();
    const slug = `bulk-${slugify(enName)}-${i}`;

    await prisma.brand.upsert({
      where: { slug },
      update: {},
      create: {
        slug,
        websiteUrl: faker.internet.url(),
        isActive: faker.datatype.boolean({ probability: 0.9 }),
        sortOrder: i,
        translations: {
          create: translations({ name: enName }, { name: trName }),
        },
        images: {
          create: {
            url: fakeImageUrl(200, 200),
            alt: `${enName} logo`,
            width: 200,
            height: 200,
            isPrimary: true,
            sortOrder: 0,
          },
        },
      },
    });

    created++;
  }

  console.log(`  Created ${created} brands`);
}

// ─── Category Seed ────────────────────────────────────────────────────────────

const L0_NAMES = [
  { en: 'Electronics', tr: 'Elektronik' },
  { en: 'Home & Garden', tr: 'Ev & Bahçe' },
  { en: 'Sports & Outdoors', tr: 'Spor & Outdoor' },
  { en: 'Beauty & Personal Care', tr: 'Güzellik & Kişisel Bakım' },
  { en: 'Toys & Games', tr: 'Oyuncak & Oyunlar' },
  { en: 'Books & Media', tr: 'Kitaplar & Medya' },
  { en: 'Food & Grocery', tr: 'Gıda & Market' },
  { en: 'Health & Wellness', tr: 'Sağlık & Wellness' },
  { en: 'Automotive', tr: 'Otomotiv' },
  { en: 'Office Supplies', tr: 'Ofis Malzemeleri' },
  { en: 'Pet Supplies', tr: 'Evcil Hayvan Ürünleri' },
  { en: 'Baby & Kids', tr: 'Bebek & Çocuk' },
  { en: 'Arts & Crafts', tr: 'Sanat & El Sanatları' },
  { en: 'Music & Instruments', tr: 'Müzik & Enstrümanlar' },
  { en: 'Industrial & Tools', tr: 'Endüstri & Aletler' },
];

const L1_SUFFIXES = [
  { en: 'Accessories', tr: 'Aksesuarlar' },
  { en: 'Premium', tr: 'Premium' },
  { en: 'Budget', tr: 'Uygun Fiyatlı' },
  { en: 'Essentials', tr: 'Temel Ürünler' },
  { en: 'Professional', tr: 'Profesyonel' },
];

const L2_SUFFIXES = [
  { en: 'New Arrivals', tr: 'Yeni Gelenler' },
  { en: 'Best Sellers', tr: 'Çok Satanlar' },
];

async function seedBulkCategories() {
  console.log('Seeding bulk categories...');
  let total = 0;

  for (let l0i = 0; l0i < L0_NAMES.length; l0i++) {
    const l0 = L0_NAMES[l0i];
    const l0Slug = `bulk-l0-${l0i}`;

    const l0Cat = await prisma.category.upsert({
      where: { slug: l0Slug },
      update: {},
      create: {
        slug: l0Slug,
        parentId: null,
        depth: 0,
        isActive: true,
        sortOrder: l0i,
        translations: {
          create: translations(
            { name: l0.en, description: `${l0.en} category` },
            { name: l0.tr, description: `${l0.tr} kategorisi` }
          ),
        },
        images: {
          create: {
            url: fakeImageUrl(400, 300),
            alt: l0.en,
            width: 400,
            height: 300,
            isPrimary: true,
            sortOrder: 0,
          },
        },
      },
    });
    total++;

    for (let l1i = 0; l1i < L1_SUFFIXES.length; l1i++) {
      const l1Suffix = L1_SUFFIXES[l1i];
      const l1Slug = `bulk-l1-${l0i}-${l1i}`;
      const l1EnName = `${l0.en} ${l1Suffix.en}`;
      const l1TrName = `${l0.tr} ${l1Suffix.tr}`;

      const l1Cat = await prisma.category.upsert({
        where: { slug: l1Slug },
        update: {},
        create: {
          slug: l1Slug,
          parentId: l0Cat.id,
          depth: 1,
          isActive: true,
          sortOrder: l1i,
          translations: {
            create: translations({ name: l1EnName }, { name: l1TrName }),
          },
          images: {
            create: {
              url: fakeImageUrl(400, 300),
              alt: l1EnName,
              width: 400,
              height: 300,
              isPrimary: true,
              sortOrder: 0,
            },
          },
        },
      });
      total++;

      for (let l2i = 0; l2i < L2_SUFFIXES.length; l2i++) {
        const l2Suffix = L2_SUFFIXES[l2i];
        const l2Slug = `bulk-l2-${l0i}-${l1i}-${l2i}`;
        const l2EnName = `${l1EnName} - ${l2Suffix.en}`;
        const l2TrName = `${l1TrName} - ${l2Suffix.tr}`;

        await prisma.category.upsert({
          where: { slug: l2Slug },
          update: {},
          create: {
            slug: l2Slug,
            parentId: l1Cat.id,
            depth: 2,
            isActive: faker.datatype.boolean({ probability: 0.85 }),
            sortOrder: l2i,
            translations: {
              create: translations({ name: l2EnName }, { name: l2TrName }),
            },
            images: {
              create: {
                url: fakeImageUrl(400, 300),
                alt: l2EnName,
                width: 400,
                height: 300,
                isPrimary: true,
                sortOrder: 0,
              },
            },
          },
        });
        total++;
      }
    }
  }

  console.log(`  Created ${total} categories (3 levels)`);
}

// ─── Tag Group + Tag Seed ─────────────────────────────────────────────────────

const TAG_GROUP_NAMES = [
  { en: 'Color Palette', tr: 'Renk Paleti' },
  { en: 'Occasion', tr: 'Kullanım Amacı' },
  { en: 'Fit Type', tr: 'Kesim Tipi' },
  { en: 'Care Instructions', tr: 'Bakım Talimatları' },
  { en: 'Sustainability', tr: 'Sürdürülebilirlik' },
  { en: 'Technology', tr: 'Teknoloji' },
  { en: 'Origin', tr: 'Menşei' },
  { en: 'Certification', tr: 'Sertifikasyon' },
  { en: 'Age Group', tr: 'Yaş Grubu' },
  { en: 'Pattern', tr: 'Desen' },
  { en: 'Closure Type', tr: 'Kapama Tipi' },
  { en: 'Neckline', tr: 'Yaka Tipi' },
  { en: 'Sleeve Length', tr: 'Kol Uzunluğu' },
  { en: 'Fabric Weight', tr: 'Kumaş Ağırlığı' },
  { en: 'Collection', tr: 'Koleksiyon' },
];

const TAG_WORD_POOLS = [
  () => faker.color.human(),
  () => faker.commerce.productAdjective(),
  () => faker.commerce.productMaterial(),
  () => faker.word.adjective(),
  () => faker.word.noun(),
];

async function seedBulkTagGroups() {
  console.log('Seeding bulk tag groups...');
  let totalTags = 0;

  for (let i = 0; i < TAG_GROUP_NAMES.length; i++) {
    const tg = TAG_GROUP_NAMES[i];
    const tgSlug = `bulk-tg-${i}`;

    const tagEntries = Array.from({ length: 20 }, (_, j) => {
      const wordFn = faker.helpers.arrayElement(TAG_WORD_POOLS);
      const word = wordFn();
      const tagSlug = `bulk-tag-${i}-${j}`;
      return {
        slug: tagSlug,
        isActive: faker.datatype.boolean({ probability: 0.9 }),
        sortOrder: j,
        translations: {
          create: [
            { locale: 'EN' as Locale, name: word },
            {
              locale: 'TR' as Locale,
              name: faker.helpers.arrayElement(TAG_WORD_POOLS)(),
            },
          ],
        },
      };
    });

    await prisma.tagGroup.upsert({
      where: { slug: tgSlug },
      update: {},
      create: {
        slug: tgSlug,
        isActive: true,
        sortOrder: i,
        translations: {
          create: translations(
            { name: tg.en, description: `${tg.en} tag group` },
            { name: tg.tr, description: `${tg.tr} etiket grubu` }
          ),
        },
        tags: {
          create: tagEntries,
        },
      },
    });

    totalTags += tagEntries.length;
  }

  console.log(
    `  Created ${TAG_GROUP_NAMES.length} tag groups with ${totalTags} tags`
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function seedBulkData() {
  console.log('=== Starting bulk mock data seed ===\n');

  await seedBulkBrands();
  await seedBulkCategories();
  await seedBulkTagGroups();

  console.log('\n=== Bulk mock data seed completed! ===');
  console.log('Summary:');
  console.log('  Brands:     ~100');
  console.log('  Categories: ~240 (15 L0 × 5 L1 × 2 L2)');
  console.log('  Tag Groups: 15');
  console.log('  Tags:       300 (15 groups × 20 tags)');
}

seedBulkData()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
