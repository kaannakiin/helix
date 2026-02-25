# Backend (apps/backend)

NestJS 11 · nestjs-zod · nestjs-i18n · Prisma 7 · Passport · ExcelJS

## Module Structure

```
src/
├── app/
│   ├── auth/           — JWT auth, sessions, devices, login history (stable, see root CLAUDE.md)
│   ├── admin/          — Admin CRUD modules (brands, categories, products, tag-groups, variant-groups, rule-engine)
│   │   └── {entity}/   — controller, service, dto/, export-config
│   ├── export/         — Excel/CSV export service
│   ├── i18n/           — i18n module + exception filters
│   └── prisma/         — PrismaService (DB connection)
├── core/
│   ├── decorators/     — @Public, @CurrentUser, @Roles, @Locale
│   └── utils/          — prisma-query-builder, cookie, ua-parser
└── main.ts             — Bootstrap (global prefix /api, Swagger, CORS, Helmet)
```

## Decorators

All exported from `core/decorators/index.ts`:

| Decorator | Return Type | Usage |
|-----------|-------------|-------|
| `@Public()` | — | Skip JWT auth guard |
| `@CurrentUser(field?)` | User / string | `@CurrentUser('sub')` → userId |
| `@Roles(...roles)` | — | `@Roles(UserRole.ADMIN, UserRole.MODERATOR)` |
| `@Locale()` | `Locale` (Prisma enum) | Converts nestjs-i18n lowercase lang → Prisma uppercase. Fallback: `TR` |

## Admin CRUD Module Pattern

Every admin entity has the same 4-endpoint structure:

| Endpoint | Method | Purpose | DTO |
|----------|--------|---------|-----|
| `/admin/{entity}/query` | POST | Paginated list for DataTable | `{Entity}QueryDTO` |
| `/admin/{entity}/lookup` | GET | Selection inputs (search + resolve) | `{Entity}LookupQueryDTO` |
| `/admin/{entity}/export` | GET | Excel/CSV export | `{Entity}ExportQueryDTO` |
| `/admin/{entity}/:id` | GET | Single record by ID | URL param |

### Adding a New Admin Entity (checklist)

1. **`packages/types/src/admin/{entity}/`** — Field config, sort fields, Prisma include query, inferred type
2. **`packages/schemas/src/admin/{entity}/`** — Query schema via `createDataQuerySchema()`, export schema
3. **`apps/backend/src/app/admin/{entity}/dto/`** — 3 DTOs (Query, Lookup, Export)
4. **`apps/backend/src/app/admin/{entity}/{entity}.service.ts`** — 4 methods
5. **`apps/backend/src/app/admin/{entity}/{entity}.controller.ts`** — 4 endpoints
6. **`apps/backend/src/app/admin/{entity}/{entity}.export-config.ts`** — Column definitions
7. **`apps/backend/src/app/admin/{entity}/{entity}.module.ts`** — Register in `admin.module.ts`

## DTO Pattern

All DTOs use `createZodDto` with `ZodDto` type cast:

```ts
import { createZodDto, type ZodDto } from 'nestjs-zod';
import { BrandQuerySchema } from '@org/schemas/admin/brands';

export class BrandQueryDTO extends (createZodDto(
  BrandQuerySchema,
) as ZodDto<typeof BrandQuerySchema, false>) {}
```

3 DTO types per entity: `{Entity}QueryDTO`, `{Entity}LookupQueryDTO`, `{Entity}ExportQueryDTO`.

## Service Patterns

### 1. Paginated Query (`getXs`)

```ts
async getBrands(query: BrandQueryDTO): Promise<PaginatedResponse<AdminBrandListPrismaType>> {
  const { page, limit, filters, sort } = query;

  const { where, orderBy, skip, take } = buildPrismaQuery({
    page,
    limit,
    filters: filters as Record<string, FilterCondition> | undefined,
    sort,
    defaultSort: { field: 'createdAt', order: 'desc' },
  });

  const [items, total] = await Promise.all([
    this.prisma.brand.findMany({
      where: where as Prisma.BrandWhereInput,
      orderBy: orderBy as Prisma.BrandOrderByWithRelationInput | Prisma.BrandOrderByWithRelationInput[],
      skip,
      take,
      include: AdminBrandListPrismaQuery,
    }),
    this.prisma.brand.count({ where: where as Prisma.BrandWhereInput }),
  ]);

  return {
    data: items,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}
```

### 2. Lookup (`lookup`)

Two modes — search by query or resolve by IDs:

```ts
async lookup(opts: { q?: string; ids?: string[]; limit: number; lang: Locale }): Promise<LookupItem[]> {
  // Mode 1: Resolve by IDs (for pre-selected items — no isActive filter)
  if (ids?.length) {
    const items = await this.prisma.brand.findMany({
      where: { id: { in: ids } },
      include: { translations: { where: { locale: lang } }, images: { where: { isPrimary: true }, take: 1 } },
    });
    return items.map(toLookupItem);
  }

  // Mode 2: Search (isActive: true filter applied)
  const items = await this.prisma.brand.findMany({
    where: { isActive: true, ...(q ? { translations: { some: { locale: lang, name: { contains: q, mode: 'insensitive' } } } } : {}) },
    take: limit,
    orderBy: { sortOrder: 'asc' },
    include: { translations: { where: { locale: lang } }, images: { where: { isPrimary: true }, take: 1 } },
  });
  return items.map(toLookupItem);
}
```

Uses `@Locale() lang` decorator in controller for Prisma-compatible locale.

### 3. Export Iterator (`*iterateXs`)

AsyncGenerator with cursor-based pagination:

```ts
async *iterateBrands(opts: {
  where: Prisma.BrandWhereInput;
  orderBy: Prisma.BrandOrderByWithRelationInput | Prisma.BrandOrderByWithRelationInput[];
  batchSize: number;
}): AsyncGenerator<AdminBrandListPrismaType[]> {
  let cursor: string | undefined;

  while (true) {
    const batch = await this.prisma.brand.findMany({
      where: opts.where,
      orderBy: opts.orderBy,
      take: opts.batchSize,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: AdminBrandListPrismaQuery,
    });

    if (batch.length === 0) break;
    yield batch;
    cursor = batch[batch.length - 1].id;
    if (batch.length < opts.batchSize) break;
  }
}
```

### 4. Get by ID (`getXById`)

```ts
async getBrandById(id: string): Promise<AdminBrandListPrismaType> {
  const brand = await this.prisma.brand.findUnique({
    where: { id },
    include: AdminBrandListPrismaQuery,
  });

  if (!brand) {
    throw new NotFoundException('common.errors.brand_not_found');
  }

  return brand;
}
```

## Export Config Pattern

Each entity defines column configuration for Excel/CSV export:

```ts
import type { ExportColumnDef } from '@org/types/export';

export const BRAND_EXPORT_COLUMNS: ExportColumnDef[] = [
  { field: 'slug', headerKey: 'common.admin.brands.table.slug', type: 'text', width: 20 },
  { field: 'isActive', headerKey: 'common.admin.brands.table.isActive', type: 'boolean', width: 12 },
  { field: '_count.products', headerKey: 'common.admin.brands.table.productsCount', type: 'number', width: 12 },
  { field: 'createdAt', headerKey: 'common.admin.brands.table.createdAt', type: 'datetime', width: 22 },
];
```

Column types: `text` | `number` | `boolean` | `date` | `datetime` | `badge`

- `field` supports dot notation for nested values (e.g. `_count.products`)
- `headerKey` is an i18n key — translated in the controller before passing to `ExportService`
- `badge` type requires a `labelMap: Record<string, string>` for enum-to-label mapping

## Prisma Include Pattern

Prisma include queries and their inferred types are defined in `packages/types`, not in the backend:

```ts
// packages/types/src/admin/brands/index.ts
import type { Prisma } from '@org/prisma/client';

export const AdminBrandListPrismaQuery = {
  translations: true,
  images: { where: { isPrimary: true }, take: 1 },
  _count: { select: { products: true } },
} as const satisfies Prisma.BrandInclude;

export type AdminBrandListPrismaType = Prisma.BrandGetPayload<{
  include: typeof AdminBrandListPrismaQuery;
}>;
```

## Error Handling

- Exception messages are always i18n keys: `throw new NotFoundException('common.errors.brand_not_found')`
- `HttpExceptionI18nFilter` auto-translates exception messages before sending HTTP response
- `ZodValidationI18nFilter` auto-translates Zod validation errors (V keys)

## Rules

- **DO NOT** use GET for `/query` endpoints — always POST with JSON body
- **DO NOT** use offset-based pagination for export iterators — always cursor-based
- **DO NOT** hardcode error messages — always use i18n keys
- **ALWAYS** use `createZodDto` + `ZodDto` cast for DTOs
- **ALWAYS** use `@Locale()` decorator for endpoints needing Prisma `Locale` enum
- **ALWAYS** filter `isActive: true` in lookup search mode (but not in ID resolve mode)
- **ALWAYS** import Prisma include queries from `@org/types/admin/{entity}`, not define in backend
