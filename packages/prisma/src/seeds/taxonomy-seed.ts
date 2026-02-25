import * as fs from 'fs';
import * as path from 'path';
import { prisma } from 'src/prisma.js';

async function parseAndSeed(locale: 'en' | 'tr', filename: string) {
  const filePath = path.join(__dirname, 'taxonomy', filename);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const lines = fileContent.split('\n').filter((line) => line.trim() !== '');

  // Skip the first line, usually comment like `# Google_Product_Taxonomy_Version: 2021-09-21`
  if (lines[0].startsWith('#')) {
    lines.shift();
  }

  console.log(`Processing ${lines.length} categories for locale ${locale}...`);

  for (const line of lines) {
    if (!line.includes(' - ')) continue;

    const [idStr, ...pathParts] = line.split(' - ');
    const id = parseInt(idStr.trim(), 10);
    const fullPath = pathParts.join(' - ').trim(); // in case ' - ' existed in the name

    // Example path: "Apparel & Accessories > Clothing > Shirts & Tops"
    const categories = fullPath.split(' > ').map((c) => c.trim());
    const name = categories[categories.length - 1];

    // Determine parentId based on the path.
    // However, since Google provides IDs, it's easier to find parent ID by looking up the parent path,
    // but we can't look up by path effectively across different locales unless we are very careful.
    // Instead, since the ID is universal across languages, we only really need to establish hierarchy ONCE (e.g. from English),
    // Or we simply do it by parsing the structure carefully, or wait, if we process line by line (which is sorted shallow to deep),
    // We can maintain a map of path -> ID during the run.
  }
}

async function main() {
  // Let's first build the hierarchy tree using the English file to get parent IDs, because IDs are universal.
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
    id: number;
    locale: string;
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
    translationsToCreate.push({ id, locale: 'en', name, path: fullPath });
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

      translationsToCreate.push({ id, locale: 'tr', name, path: fullPath });
    }
  }

  console.log('Inserting into DB. This might take a minute...');

  // Use a transaction and chunks for performance
  const CATEGORY_CHUNK = 500;
  for (let i = 0; i < categoriesToCreate.length; i += CATEGORY_CHUNK) {
    const chunk = categoriesToCreate.slice(i, i + CATEGORY_CHUNK);
    await prisma.$transaction(
      chunk.map((cat) =>
        prisma.googleTaxonomy.upsert({
          where: { id: cat.id },
          update: { parentId: cat.parentId },
          create: { id: cat.id, parentId: cat.parentId },
        })
      )
    );
  }

  const TRANSLATION_CHUNK = 1000;
  for (let i = 0; i < translationsToCreate.length; i += TRANSLATION_CHUNK) {
    const chunk = translationsToCreate.slice(i, i + TRANSLATION_CHUNK);
    await prisma.$transaction(
      chunk.map((tr) =>
        prisma.googleTaxonomyTranslation.upsert({
          where: {
            googleTaxonomyId_locale: {
              googleTaxonomyId: tr.id,
              locale: tr.locale as 'EN' | 'TR',
            },
          },
          update: { name: tr.name, path: tr.path },
          create: {
            googleTaxonomyId: tr.id,
            locale: tr.locale as 'EN' | 'TR',
            name: tr.name,
            path: tr.path,
          },
        })
      )
    );
  }

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
