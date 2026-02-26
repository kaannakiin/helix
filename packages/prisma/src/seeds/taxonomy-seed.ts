import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { Locale } from '../browser.js';
import { prisma } from '../prisma.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const enFilePath = path.join(
    __dirname,
    'taxonomy',
    'taxonomy-with-ids.en-US.txt'
  );
  if (!fs.existsSync(enFilePath)) {
    console.error(`File not found: ${enFilePath}`);
    process.exit(1);
  }

  const enContent = fs.readFileSync(enFilePath, 'utf-8');
  const enLines = enContent
    .split('\n')
    .filter((l) => l.trim() && !l.startsWith('#'));

  const pathToId = new Map<string, number>();
  const categoriesToCreate: { id: number; parentId: number | null }[] = [];
  const translationsToCreate: {
    googleTaxonomyId: number;
    locale: Locale;
    name: string;
    path: string;
  }[] = [];

  console.log('Parsing English taxonomy...');
  for (const line of enLines) {
    const [idStr, ...pathParts] = line.split(' - ');
    const id = parseInt(idStr.trim(), 10);
    const fullPath = pathParts.join(' - ').trim();
    pathToId.set(fullPath, id);

    const parts = fullPath.split(' > ').map((p) => p.trim());
    const name = parts[parts.length - 1];

    let parentId: number | null = null;
    if (parts.length > 1) {
      const parentPath = parts.slice(0, -1).join(' > ');
      parentId = pathToId.get(parentPath) || null;
    }

    categoriesToCreate.push({ id, parentId });
    translationsToCreate.push({
      googleTaxonomyId: id,
      locale: 'EN',
      name,
      path: fullPath,
    });
  }

  const trFilePath = path.join(
    __dirname,
    'taxonomy',
    'taxonomy-with-ids.tr-TR.txt'
  );
  let hasTr = false;
  if (fs.existsSync(trFilePath)) {
    hasTr = true;
    console.log('Parsing Turkish taxonomy...');
    const trContent = fs.readFileSync(trFilePath, 'utf-8');
    const trLines = trContent
      .split('\n')
      .filter((l) => l.trim() && !l.startsWith('#'));
    for (const line of trLines) {
      const [idStr, ...pathParts] = line.split(' - ');
      const id = parseInt(idStr.trim(), 10);
      const fullPath = pathParts.join(' - ').trim();
      const parts = fullPath.split(' > ').map((p) => p.trim());
      const name = parts[parts.length - 1];

      translationsToCreate.push({
        googleTaxonomyId: id,
        locale: 'TR',
        name,
        path: fullPath,
      });
    }
  }

  await prisma.googleTaxonomyTranslation.deleteMany();
  await prisma.googleTaxonomy.deleteMany();
  console.log('Cleared existing taxonomy data.');

  const CHUNK = 500;

  for (let i = 0; i < categoriesToCreate.length; i += CHUNK) {
    const chunk = categoriesToCreate.slice(i, i + CHUNK);
    await prisma.googleTaxonomy.createMany({ data: chunk });
  }
  console.log(`Inserted ${categoriesToCreate.length} categories.`);

  for (let i = 0; i < translationsToCreate.length; i += CHUNK) {
    const chunk = translationsToCreate.slice(i, i + CHUNK);
    await prisma.googleTaxonomyTranslation.createMany({ data: chunk });
  }
  console.log(`Inserted ${translationsToCreate.length} translations.`);

  console.log('Google Taxonomy seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
