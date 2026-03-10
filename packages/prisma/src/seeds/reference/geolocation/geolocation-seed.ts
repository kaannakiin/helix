import { CountryType, Locale } from '../../../browser.js';
import { prisma } from '../../../prisma.js';

const FULL_DEPTH_COUNTRIES = (process.env.SEED_GEO_FULL_DEPTH || 'TR')
  .split(',')
  .map((s) => s.trim().toUpperCase());
const SEED_ALL_FULL = FULL_DEPTH_COUNTRIES.includes('ALL');

const DELAY_MS = parseInt(process.env.SEED_GEO_DELAY_MS || '300', 10);
const RESUME_MODE = process.env.SEED_GEO_RESUME === 'true';

const MAX_RETRIES = 5;
const CHUNK_SIZE = 500;

interface IkasLocationTranslations {
  tr: string;
  en: string;
}

interface IkasCountry {
  id: string;
  name: string;
  iso2: string;
  iso3: string;
  phoneCode: string;
  currency: string;
  currencyCode: string;
  currencySymbol: string;
  emoji: string;
  native: string;
  region: string;
  subregion: string;
  locationTranslations: IkasLocationTranslations;
}

interface IkasState {
  id: string;
  countryId: string;
  name: string;
  native: string;
  stateCode: string;
  locationTranslations: IkasLocationTranslations;
}

interface IkasCity {
  id: string;
  cityCode: string;
  countryId: string;
  stateId: string;
  latitude: string;
  longitude: string;
  name: string;
  order: number;
}

interface IkasDistrict {
  id: string;
  cityId: string;
  countryId: string;
  stateId: string;
  latitude: string;
  longitude: string;
  name: string;
  order: number;
}

interface IkasTown {
  id: string;
  districtId: string;
  name: string;
  order: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const startTime = Date.now();

function elapsed(): string {
  const sec = Math.floor((Date.now() - startTime) / 1000);
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

let requestCount = 0;

async function graphqlRequest<T>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (requestCount > 0) {
      await sleep(DELAY_MS);
    }

    requestCount++;

    try {
      const response = await fetch(
        'https://api.myikas.com/api/v1/admin/graphql',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, variables }),
        }
      );

      if (response.status === 429 || response.status >= 500) {
        const backoffMs = Math.min(1000 * Math.pow(2, attempt), 30000);
        console.warn(
          `  ⚠️  HTTP ${
            response.status
          } — ${backoffMs}ms beklenip tekrar denenecek (${
            attempt + 1
          }/${MAX_RETRIES})`
        );
        await sleep(backoffMs);
        lastError = new Error(`HTTP ${response.status}`);
        continue;
      }

      if (!response.ok) {
        throw new Error(
          `GraphQL failed: ${response.status} ${response.statusText}`
        );
      }

      const json = (await response.json()) as {
        data?: T;
        errors?: Array<{ message: string }>;
      };

      if (json.errors && json.errors.length > 0) {
        throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
      }

      return json.data as T;
    } catch (error) {
      if (attempt === MAX_RETRIES - 1) throw error;
      const backoffMs = Math.min(1000 * Math.pow(2, attempt), 30000);
      console.warn(
        `  ⚠️  ${
          (error as Error).message
        } — ${backoffMs}ms beklenip tekrar denenecek (${
          attempt + 1
        }/${MAX_RETRIES})`
      );
      await sleep(backoffMs);
      lastError = error as Error;
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

const LIST_COUNTRIES_QUERY = `
  query {
    listCountry {
      id name iso2 iso3 phoneCode currency currencyCode currencySymbol
      emoji native region subregion
      locationTranslations { tr en }
    }
  }
`;

const LIST_STATES_QUERY = `
  query ListStates($countryId: StringFilterInput!) {
    listState(countryId: $countryId) {
      id countryId name native stateCode
      locationTranslations { tr en }
    }
  }
`;

const LIST_CITIES_QUERY = `
  query ListCities($stateId: StringFilterInput!) {
    listCity(stateId: $stateId) {
      id cityCode countryId stateId latitude longitude name order
    }
  }
`;

const LIST_DISTRICTS_QUERY = `
  query ListDistricts($cityId: StringFilterInput!) {
    listDistrict(cityId: $cityId) {
      id cityId countryId stateId latitude longitude name order
    }
  }
`;

const LIST_TOWNS_QUERY = `
  query ListTowns($districtId: StringFilterInput!) {
    listTown(districtId: $districtId) {
      id districtId name order
    }
  }
`;

async function fetchCountries(): Promise<IkasCountry[]> {
  const data = await graphqlRequest<{ listCountry: IkasCountry[] }>(
    LIST_COUNTRIES_QUERY
  );
  return data.listCountry;
}

async function fetchStates(countryId: string): Promise<IkasState[]> {
  const data = await graphqlRequest<{ listState: IkasState[] }>(
    LIST_STATES_QUERY,
    { countryId: { eq: countryId } }
  );
  return data.listState;
}

async function fetchCities(stateId: string): Promise<IkasCity[]> {
  const data = await graphqlRequest<{ listCity: IkasCity[] }>(
    LIST_CITIES_QUERY,
    { stateId: { eq: stateId } }
  );
  return data.listCity;
}

async function fetchDistricts(cityId: string): Promise<IkasDistrict[]> {
  const data = await graphqlRequest<{ listDistrict: IkasDistrict[] }>(
    LIST_DISTRICTS_QUERY,
    { cityId: { eq: cityId } }
  );
  return data.listDistrict;
}

async function fetchTowns(districtId: string): Promise<IkasTown[]> {
  const data = await graphqlRequest<{ listTown: IkasTown[] }>(
    LIST_TOWNS_QUERY,
    { districtId: { eq: districtId } }
  );
  return data.listTown;
}

async function insertInChunks<T>(
  data: T[],
  insertFn: (chunk: T[]) => Promise<unknown>
): Promise<void> {
  for (let i = 0; i < data.length; i += CHUNK_SIZE) {
    const chunk = data.slice(i, i + CHUNK_SIZE);
    await insertFn(chunk);
  }
}

function detectCountryType(states: IkasState[]): CountryType {
  if (states.length === 0) return 'COUNTRY_ONLY';
  if (states.length === 1 && states[0].name.toLowerCase() === 'default') {
    return 'HAS_CITIES_ONLY';
  }
  return 'HAS_STATES';
}

async function seedCountries(
  ikasCountries: IkasCountry[]
): Promise<Map<string, string>> {
  const countryMap = new Map<string, string>();

  const countryData = ikasCountries.map((c, i) => ({
    code: c.iso2,
    iso3: c.iso3,
    phoneCode: c.phoneCode || null,
    currency: c.currency || null,
    currencyCode: c.currencyCode || null,
    currencySymbol: c.currencySymbol || null,
    native: c.native || null,
    region: c.region || null,
    subregion: c.subregion || null,
    emoji: c.emoji || null,
    isActive: true,
    sortOrder: i,
  }));

  await insertInChunks(countryData, async (chunk) => {
    await prisma.country.createMany({ data: chunk, skipDuplicates: true });
  });

  const dbCountries = await prisma.country.findMany({
    select: { id: true, code: true },
  });
  for (const c of dbCountries) {
    countryMap.set(c.code, c.id);
  }

  const translations: Array<{
    countryId: string;
    locale: Locale;
    name: string;
  }> = [];

  for (const c of ikasCountries) {
    const dbId = countryMap.get(c.iso2);
    if (!dbId) continue;
    if (c.locationTranslations?.en) {
      translations.push({
        countryId: dbId,
        locale: 'EN',
        name: c.locationTranslations.en,
      });
    }
    if (c.locationTranslations?.tr) {
      translations.push({
        countryId: dbId,
        locale: 'TR',
        name: c.locationTranslations.tr,
      });
    }
  }

  await insertInChunks(translations, async (chunk) => {
    await prisma.countryTranslation.createMany({
      data: chunk,
      skipDuplicates: true,
    });
  });

  console.log(
    `  ${ikasCountries.length} ulke + ${translations.length} ceviri eklendi.`
  );
  return countryMap;
}

async function seedCountryDeep(
  ikasCountryId: string,
  dbCountryId: string,
  countryCode: string,
  isFullDepth: boolean
): Promise<CountryType> {
  const ikasStates = await fetchStates(ikasCountryId);
  const countryType = detectCountryType(ikasStates);

  await prisma.country.update({
    where: { id: dbCountryId },
    data: { countryType },
  });

  if (countryType === 'COUNTRY_ONLY') {
    console.log(`    -> COUNTRY_ONLY (state yok)`);
    return countryType;
  }

  console.log(`    -> ${countryType} (${ikasStates.length} state)`);

  const stateData = ikasStates.map((s, i) => ({
    countryId: dbCountryId,
    name: s.name,
    native: s.native || null,
    stateCode: s.stateCode || null,
    isActive: true,
    sortOrder: i,
  }));

  await insertInChunks(stateData, async (chunk) => {
    await prisma.state.createMany({ data: chunk, skipDuplicates: true });
  });

  const dbStates = await prisma.state.findMany({
    where: { countryId: dbCountryId },
    select: { id: true, name: true },
  });
  const stateNameToId = new Map(dbStates.map((s) => [s.name, s.id]));

  const ikasStateIdToDb = new Map<string, string>();
  for (const s of ikasStates) {
    const dbId = stateNameToId.get(s.name);
    if (dbId) ikasStateIdToDb.set(s.id, dbId);
  }

  const stateTranslations: Array<{
    stateId: string;
    locale: Locale;
    name: string;
  }> = [];

  for (const s of ikasStates) {
    const dbId = ikasStateIdToDb.get(s.id);
    if (!dbId) continue;
    if (s.locationTranslations?.en) {
      stateTranslations.push({
        stateId: dbId,
        locale: 'EN',
        name: s.locationTranslations.en,
      });
    }
    if (s.locationTranslations?.tr) {
      stateTranslations.push({
        stateId: dbId,
        locale: 'TR',
        name: s.locationTranslations.tr,
      });
    }
  }

  await insertInChunks(stateTranslations, async (chunk) => {
    await prisma.stateTranslation.createMany({
      data: chunk,
      skipDuplicates: true,
    });
  });

  let totalCities = 0;
  let totalDistricts = 0;
  let totalTowns = 0;
  const stateEntries = Array.from(ikasStateIdToDb.entries());

  for (let si = 0; si < stateEntries.length; si++) {
    const [ikasStateId, dbStateId] = stateEntries[si];
    const stateName = ikasStates.find((s) => s.id === ikasStateId)?.name || '?';
    const ikasCities = await fetchCities(ikasStateId);

    if (ikasCities.length === 0) {
      console.log(
        `      [${elapsed()}] State ${si + 1}/${
          stateEntries.length
        } "${stateName}" -- 0 city`
      );
      continue;
    }

    const cityData = ikasCities.map((c, i) => ({
      countryId: dbCountryId,
      stateId: dbStateId,
      name: c.name,
      cityCode: c.cityCode || null,
      latitude: c.latitude || null,
      longitude: c.longitude || null,
      sortOrder: c.order ?? i,
      isActive: true,
    }));

    await insertInChunks(cityData, async (chunk) => {
      await prisma.city.createMany({ data: chunk, skipDuplicates: true });
    });

    totalCities += ikasCities.length;

    if (isFullDepth) {
      const dbCities = await prisma.city.findMany({
        where: { stateId: dbStateId },
        select: { id: true, name: true },
      });
      const cityNameToId = new Map(dbCities.map((c) => [c.name, c.id]));

      let stateDistricts = 0;
      let stateTowns = 0;

      for (let ci = 0; ci < ikasCities.length; ci++) {
        const ikasCity = ikasCities[ci];
        const dbCityId = cityNameToId.get(ikasCity.name);
        if (!dbCityId) continue;

        const ikasDistricts = await fetchDistricts(ikasCity.id);

        if (ikasDistricts.length === 0) {
          if ((ci + 1) % 10 === 0 || ci === ikasCities.length - 1) {
            process.stdout.write(
              `\r      [${elapsed()}] State ${si + 1}/${
                stateEntries.length
              } "${stateName}" -- city ${ci + 1}/${
                ikasCities.length
              }, ${stateDistricts} ilce, ${stateTowns} mahalle`
            );
          }
          continue;
        }

        const districtData = ikasDistricts.map((d, i) => ({
          cityId: dbCityId,
          countryId: dbCountryId,
          stateId: dbStateId,
          name: d.name,
          latitude: d.latitude || null,
          longitude: d.longitude || null,
          sortOrder: d.order ?? i,
          isActive: true,
        }));

        await insertInChunks(districtData, async (chunk) => {
          await prisma.district.createMany({
            data: chunk,
            skipDuplicates: true,
          });
        });

        stateDistricts += ikasDistricts.length;

        const dbDistricts = await prisma.district.findMany({
          where: { cityId: dbCityId },
          select: { id: true, name: true },
        });
        const districtNameToId = new Map(
          dbDistricts.map((d) => [d.name, d.id])
        );

        for (const ikasDistrict of ikasDistricts) {
          const dbDistrictId = districtNameToId.get(ikasDistrict.name);
          if (!dbDistrictId) continue;

          const ikasTowns = await fetchTowns(ikasDistrict.id);
          if (ikasTowns.length === 0) continue;

          const townData = ikasTowns.map((t, i) => ({
            districtId: dbDistrictId,
            name: t.name,
            sortOrder: t.order ?? i,
            isActive: true,
          }));

          await insertInChunks(townData, async (chunk) => {
            await prisma.town.createMany({ data: chunk, skipDuplicates: true });
          });

          stateTowns += ikasTowns.length;
        }

        process.stdout.write(
          `\r      [${elapsed()}] State ${si + 1}/${
            stateEntries.length
          } "${stateName}" -- city ${ci + 1}/${
            ikasCities.length
          }, ${stateDistricts} ilce, ${stateTowns} mahalle`
        );
      }

      totalDistricts += stateDistricts;
      totalTowns += stateTowns;

      console.log(
        `\r      [${elapsed()}] State ${si + 1}/${
          stateEntries.length
        } "${stateName}" OK -- ${
          ikasCities.length
        } city, ${stateDistricts} ilce, ${stateTowns} mahalle`
      );
    } else {
      console.log(
        `      [${elapsed()}] State ${si + 1}/${
          stateEntries.length
        } "${stateName}" -- ${ikasCities.length} city`
      );
    }
  }

  console.log(
    `    ${countryCode} tamamlandi: ${
      ikasStates.length
    } state, ${totalCities} city${
      isFullDepth ? `, ${totalDistricts} ilce, ${totalTowns} mahalle` : ''
    } [API: ${requestCount} istek]`
  );
  return countryType;
}

async function main() {
  console.log('=== Geolocation Seed ===');
  console.log(
    `  Full depth: ${SEED_ALL_FULL ? 'ALL' : FULL_DEPTH_COUNTRIES.join(', ')}`
  );
  console.log(`  Delay: ${DELAY_MS}ms | Resume: ${RESUME_MODE ? 'ON' : 'OFF'}`);
  console.log('');

  if (!RESUME_MODE) {
    const warehouseCount = await prisma.warehouse.count();
    if (warehouseCount > 0) {
      console.error(
        'Warehouse kayitlari var -- once silin veya SEED_GEO_RESUME=true kullanin.'
      );
      process.exit(1);
    }

    console.log('Mevcut geolocation verileri siliniyor...');
    await prisma.town.deleteMany();
    await prisma.district.deleteMany();
    await prisma.city.deleteMany();
    await prisma.stateTranslation.deleteMany();
    await prisma.state.deleteMany();
    await prisma.countryTranslation.deleteMany();
    await prisma.country.deleteMany();
    console.log('  Silindi.\n');
  }

  console.log('Ulkeler cekiliyor...');
  const ikasCountries = await fetchCountries();
  console.log(`  ${ikasCountries.length} ulke bulundu.\n`);

  console.log("Ulkeler DB'ye yaziliyor...");
  const countryMap = await seedCountries(ikasCountries);

  console.log('\nState -> City -> District -> Town cekiliyor...\n');

  const typeCounts: Record<CountryType, number> = {
    HAS_STATES: 0,
    HAS_CITIES_ONLY: 0,
    COUNTRY_ONLY: 0,
  };

  for (let ci = 0; ci < ikasCountries.length; ci++) {
    const ikasCountry = ikasCountries[ci];
    const dbCountryId = countryMap.get(ikasCountry.iso2);
    if (!dbCountryId) continue;

    const isFullDepth =
      SEED_ALL_FULL || FULL_DEPTH_COUNTRIES.includes(ikasCountry.iso2);

    console.log(
      `  [${elapsed()}] [${ci + 1}/${ikasCountries.length}] ${
        ikasCountry.iso2
      } -- ${ikasCountry.name}${isFullDepth ? ' (FULL DEPTH)' : ''}`
    );

    const detectedType = await seedCountryDeep(
      ikasCountry.id,
      dbCountryId,
      ikasCountry.iso2,
      isFullDepth
    );

    typeCounts[detectedType]++;
  }

  const [countryCount, stateCount, cityCount, districtCount, townCount] =
    await Promise.all([
      prisma.country.count(),
      prisma.state.count(),
      prisma.city.count(),
      prisma.district.count(),
      prisma.town.count(),
    ]);

  console.log('\n=== Seed Tamamlandi ===');
  console.log(`  Sure:            ${elapsed()}`);
  console.log(`  API istekleri:   ${requestCount}`);
  console.log('  ─────────────────────────');
  console.log(`  Ulkeler:         ${countryCount}`);
  console.log(`    HAS_STATES:      ${typeCounts.HAS_STATES}`);
  console.log(`    HAS_CITIES_ONLY: ${typeCounts.HAS_CITIES_ONLY}`);
  console.log(`    COUNTRY_ONLY:    ${typeCounts.COUNTRY_ONLY}`);
  console.log(`  State'ler:       ${stateCount}`);
  console.log(`  City'ler:        ${cityCount}`);
  console.log(`  Ilceler:         ${districtCount}`);
  console.log(`  Mahalleler:      ${townCount}`);
}

main()
  .catch((e) => {
    console.error('\nSeed hatasi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
