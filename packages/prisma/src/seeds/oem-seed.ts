import { faker } from '@faker-js/faker';
import { prisma } from '../prisma.js';

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function oemSeed() {
  console.log('Starting hierarchical OEM numbers seed with Faker...');

  const tagGroup = await prisma.tagGroup.upsert({
    where: { slug: 'oem-numbers' },
    update: {},
    create: {
      slug: 'oem-numbers',
      isActive: true,
      translations: {
        create: [
          { locale: 'EN', name: 'OEM Numbers' },
          { locale: 'TR', name: 'OEM Numaraları' },
        ],
      },
    },
  });

  console.log(`OEM Numbers TagGroup created/found: ${tagGroup.id}`);

  let manufacturerCount = 0;
  let oemCount = 0;

  const manufacturers = new Set<string>();
  while (manufacturers.size < 25) {
    manufacturers.add(faker.vehicle.manufacturer());
  }

  for (const manufacturer of manufacturers) {
    const manufacturerSlug = generateSlug(manufacturer);

    let parentTag = await prisma.tag.findFirst({
      where: {
        tagGroupId: tagGroup.id,
        slug: manufacturerSlug,
        parentTagId: null,
      },
    });

    if (!parentTag) {
      parentTag = await prisma.tag.create({
        data: {
          tagGroupId: tagGroup.id,
          slug: manufacturerSlug,
          isActive: true,
          depth: 0,
          parentTagId: null,
          translations: {
            create: [
              { locale: 'EN', name: manufacturer },
              { locale: 'TR', name: manufacturer },
            ],
          },
        },
      });
    }
    manufacturerCount++;

    console.log(`  Manufacturer: ${manufacturer} (${parentTag.id})`);

    const numOems = faker.number.int({ min: 40, max: 60 });
    const oemNumbers = new Set<string>();
    while (oemNumbers.size < numOems) {
      oemNumbers.add(
        faker.string.alphanumeric({
          length: { min: 8, max: 12 },
          casing: 'upper',
        })
      );
    }

    for (const oem of oemNumbers) {
      const oemSlug = generateSlug(oem);

      const existing = await prisma.tag.findFirst({
        where: {
          tagGroupId: tagGroup.id,
          slug: oemSlug,
          parentTagId: parentTag.id,
        },
      });

      if (!existing) {
        await prisma.tag.create({
          data: {
            tagGroupId: tagGroup.id,
            slug: oemSlug,
            isActive: true,
            depth: 1,
            parentTagId: parentTag.id,
            translations: {
              create: [{ locale: 'TR', name: oem }],
            },
          },
        });
        oemCount++;
      }
    }
  }

  console.log(
    `\nSeed completed! Processed ${manufacturerCount} manufacturer tags and created ${oemCount} OEM number tags.`
  );
}

oemSeed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
