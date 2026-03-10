# CLAUDE.md — Backend (NestJS)

## Commands

```bash
npx nx serve backend          # dev server on :3003, Swagger at /docs
npx nx test backend           # Jest tests
npx nx build backend          # webpack production build
npx nx lint backend           # ESLint
npx nx typecheck backend      # TypeScript validation
```

## Module Structure

Admin modules live in `src/app/admin/{domain}/`, storefront modules in `src/app/storefront/`. Shared modules (export, upload, prisma, redis, i18n, geolocation) are at `src/app/` level.

Each domain module contains:
```
{domain}/
  {domain}.module.ts
  {domain}.controller.ts
  {domain}.service.ts
  dto/
    {domain}-query.dto.ts
    {domain}-save.dto.ts
    {domain}-export-query.dto.ts   # optional
```

## Creating a New Module

### DTO

DTOs wrap Zod schemas from `@org/schemas` via `nestjs-zod`:

```typescript
import { BackendBrandSchema } from '@org/schemas/admin/brands';
import { createZodDto, type ZodDto } from 'nestjs-zod';

export class BrandSaveDTO extends (createZodDto(
  BackendBrandSchema
) as ZodDto<typeof BackendBrandSchema, false>) {}
```

Always use `BackendFooSchema` (not `FooSchema`) — backend schemas exclude frontend-only fields like `images`.

### Controller

```typescript
@ApiTags('Admin - Brands')
@Controller('admin/brands')
@UseInterceptors(ContentLocaleInterceptor)
export class BrandsController {
  constructor(
    private readonly brandsService: BrandsService,
    private readonly exportService: ExportService,
  ) {}

  @Post('query')
  async getBrands(@Body() query: BrandQueryDTO, @ContentLocale() locale: Locale) {
    return this.brandsService.getBrands(query, locale);
  }

  @Post('save')
  async saveBrand(@Body() body: BrandSaveDTO, @ContentLocale() locale: Locale) {
    return this.brandsService.saveBrand(body, locale);
  }

  @Get(':id')
  async getBrand(@Param('id') id: string, @ContentLocale() locale: Locale) {
    return this.brandsService.getBrand(id, locale);
  }

  @Delete(':id')
  async deleteBrand(@Param('id') id: string) {
    return this.brandsService.deleteBrand(id);
  }
}
```

Standard endpoints: `POST query` (paginated list), `POST save` (create/update), `GET :id`, `DELETE :id`.

### Service

```typescript
@Injectable()
export class BrandsService {
  // For modules with _count filters on relations:
  private static readonly COUNT_RELATIONS: CountRelationMap = {
    products: { table: 'Product', fk: 'brandId' },
  };

  constructor(private readonly prisma: PrismaService) {}

  async getBrands(query: BrandQueryDTO, locale: Locale): Promise<PaginatedResponse<Brand>> {
    const { page, limit, filters, sort, search } = query;
    const { where: baseWhere, orderBy, skip, take, countFilters } = buildPrismaQuery({
      page, limit, filters, sort, search,
      defaultSort: { field: 'createdAt', order: 'desc' },
    });

    const where = await resolveCountFilters(
      this.prisma, 'Brand', BrandsService.COUNT_RELATIONS, countFilters, baseWhere,
    );

    const [items, total] = await Promise.all([
      this.prisma.brand.findMany({ where, orderBy, skip, take }),
      this.prisma.brand.count({ where }),
    ]);

    return { items, total };
  }
}
```

### Module

```typescript
@Module({
  imports: [PrismaModule, ExportModule, UploadModule],
  controllers: [BrandsController],
  providers: [BrandsService],
})
export class BrandsModule {}
```

## Global Providers (AppModule)

| Provider | Type | Purpose |
|----------|------|---------|
| `ZodValidationPipe` | APP_PIPE | Auto-validates DTOs against Zod schemas |
| `ZodSerializerInterceptor` | APP_INTERCEPTOR | Serializes outgoing responses |
| `HttpExceptionI18nFilter` | APP_FILTER | Translates HTTP exception messages via i18n |
| `ZodValidationI18nFilter` | APP_FILTER | Translates Zod validation errors via i18n |

`JwtAuthGuard` is registered as APP_GUARD in `AdminAuthModule` — all admin routes are protected by default.

## Core Decorators

| Decorator | Purpose |
|-----------|---------|
| `@Public()` | Bypasses `JwtAuthGuard` for unauthenticated routes |
| `@CurrentUser()` | Extracts `TokenPayload` from `request.user` |
| `@ContentLocale()` | Gets installation's default locale (requires `ContentLocaleInterceptor`) |
| `@Locale()` | Gets UI locale from i18n context (uppercase, default: `TR`) |
| `@AuthSurface(surface)` | Distinguishes admin vs storefront auth context |

## Auth System

**Admin:** JWT in httpOnly cookie (`ACCESS_TOKEN_COOKIE_NAME`). Strategies: local (email+password), JWT, refresh. Global `JwtAuthGuard` with `@Public()` for open routes.

**Storefront:** Separate module with `CustomerJwtAuthGuard` + `StoreScopeGuard` for multi-tenant isolation. Additional OAuth strategies: Google, Facebook, Instagram (conditionally loaded).

Cookie paths differ: admin uses `/admin`, storefront uses `/`. Production: `secure=true`, `sameSite: 'none'`.

## Error Handling

Throw NestJS exceptions with i18n message keys:
```typescript
throw new NotFoundException('backend.errors.brand_not_found');
```

For parameterized messages, pipe-separate the args:
```typescript
throw new BadRequestException('backend.errors.file_too_large|{"max":"10MB"}');
```

`HttpExceptionI18nFilter` translates the key using `Accept-Language` or `x-lang` header.

## Prisma Where Filters — Always Type Them

**Never use `as any` on Prisma where objects.** Always annotate filters with `Prisma.{Model}WhereInput` so TypeScript catches invalid field names at compile time instead of runtime `PrismaClientValidationError`.

```typescript
import type { Prisma } from '@org/prisma/client';

// Good — typos and invalid relations are caught at compile time
const storeFilter: Prisma.ProductVariantWhereInput = {
  product: { is: { stores: { some: { storeId } } } },
};
const where: Prisma.ProductVariantWhereInput = {
  ...storeFilter,
  AND: [...searchFilter, ...notInFilter],
};

// Bad — silent runtime error if field name is wrong
const where = { ...storeFilter, AND: [...] } as any;
```

**Import:** Always use `import type { Prisma } from '@org/prisma/client'` (not `@prisma/client`).

**After schema changes:** Run `npx nx prisma-generate prisma` to regenerate the client — stale types cause the exact same class of runtime errors.

## Query Builder

`buildPrismaQuery()` in `src/core/utils/prisma-query-builder.ts` converts ag-grid filter/sort params to Prisma queries. Supports text, number, date, boolean, enum filters. For `_count.relation` filters (e.g., "products with more than 5 variants"), use `resolveCountFilters()` with a `COUNT_RELATIONS` map — these become raw SQL subqueries.

## File Upload

- MinIO storage via `UploadService`
- Validate with `FileValidationPipe({ allowedTypes: ['IMAGE'] })`
- Upload endpoint uses `@UseInterceptors(FileInterceptor('file'))`
- Images have polymorphic ownership: `ImageOwnerType` maps to path prefix and Prisma field

## Export

`ExportService.generateExport(config, options)` returns a streaming response (CSV via `@fast-csv/format`, XLSX via `exceljs`). Batch sizes: CSV 1000, XLSX 500. Pipe `stream` to `res` with appropriate headers.

## BullMQ Jobs

Redis-backed job queue via `@nestjs/bullmq`. Pattern:
- Register queue: `BullModule.registerQueue({ name: QUEUE_NAME })`
- Inject: `@InjectQueue(QUEUE_NAME)`
- Process: `@Processor(QUEUE_NAME)` class with `@WorkerHost`
- Default: 3 attempts, exponential backoff (5s)

## i18n Resolution Order

1. Cookie: `LOCALE`
2. Query param: `lang`
3. `Accept-Language` header
4. `x-lang` header
5. Fallback: `en`

## PrismaService

Extends `PrismaClient` with `PrismaPg` adapter. Global `omit: { user: { password: true } }` — passwords are never returned. Connects on module init.
