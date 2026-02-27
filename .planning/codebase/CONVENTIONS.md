# Coding Conventions

**Analysis Date:** 2026-02-27

## Naming Patterns

**Files:**
- Kebab-case with descriptive names: `brands.controller.ts`, `brands.service.ts`, `brands.export-config.ts`
- DTO files grouped in `dto/` directory: `brand-query.dto.ts`, `brand-save.dto.ts`
- Test files use `.spec.ts` suffix: `login.spec.ts`, `utils.spec.ts`
- Hook files use `use` prefix: `useAuth.ts`, `useAdminLookup.ts`, `useFormErrorTranslator.ts`
- Store files use `.store.ts` suffix: `auth.store.ts`
- Component files are PascalCase: `AdminHeader.tsx`, `LogoutButton.tsx`

**Functions:**
- camelCase for all function names: `getBrands`, `lookupBrands`, `iterateBrands`, `saveBrand`
- Private/internal functions prefixed with underscore: `_tryTranslate` (rare, most are public)
- Service methods follow verb-noun pattern: `get`, `lookup`, `iterate`, `save`, `create`, `update`
- Utility functions are standalone camelCase: `createAuthClient`, `registerAndGetCredentials`, `uniqueEmail`

**Variables:**
- camelCase for all variables and constants: `page`, `limit`, `filters`, `sort`, `batchSize`
- Constants in UPPER_SNAKE_CASE when exported: `DEFAULT_PASSWORD = 'TestPass123'`, `LOOKUP_LIMIT = 20`
- Private/module-level constants: `LOOKUP_LIMIT = 20` (same case, scoped to file)
- Boolean variables prefixed with is/has: `isActive`, `isPrimary`, `isAuthenticated`

**Types:**
- PascalCase for interfaces and type aliases: `AuthState`, `BrandQueryDTO`, `AdminBrandListPrismaType`
- Prisma types include scope: `AdminBrandListPrismaType`, `AdminBrandDetailPrismaType` (Admin prefix indicates admin context)
- DTO types end with DTO: `BrandQueryDTO`, `BrandSaveDTO`, `BrandExportQueryDTO`, `BrandLookupQueryDTO`
- Response types: `PaginatedResponse<T>`, `LookupItem`, `ApiError`

## Code Style

**Formatting:**
- Prettier configured with `singleQuote: true` (single quotes for all strings)
- Line length: Prettier default (80 chars)
- Indentation: 2 spaces (inferred from eslint.config.mjs)
- Trailing commas: ES5 style (Prettier default)

**Linting:**
- ESLint with Nx plugin (`@nx/eslint-plugin`)
- Enforces module boundaries: `@nx/enforce-module-boundaries` rule prevents circular dependencies
- TypeScript strict mode enabled (inferred from tsconfig)
- No explicit rules override beyond module boundary enforcement in eslint.config.mjs

**Import style:**
- Use named imports when possible: `import { Body, Controller, Get } from '@nestjs/common'`
- Use default imports for default exports: `import { BrandsService } from './brands.service'`
- Always use full file extensions in Node/Nx contexts (implicit in TypeScript)

## Import Organization

**Order (observed pattern):**

1. **External dependencies** — Framework and library imports (NestJS, React, third-party)
   ```ts
   import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
   import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
   import type { Locale, Prisma } from '@org/prisma/client';
   ```

2. **Internal monorepo packages** — Shared types, schemas, constants prefixed with `@org/`
   ```ts
   import type { FilterCondition, SortCondition } from '@org/types/data-query';
   import { DATA_ACCESS_KEYS } from '@org/constants/data-keys';
   import { BrandQuerySchema } from '@org/schemas/admin/brands';
   ```

3. **Local application code** — Relative imports within the app
   ```ts
   import { buildPrismaQuery } from '../../../core/utils/prisma-query-builder';
   import { BrandsService } from './brands.service';
   import { BrandQueryDTO } from './dto';
   ```

**Path Aliases:**
- `@org/*` — Monorepo packages (e.g., `@org/backend`, `@org/schemas`, `@org/types`)
- `@/` — Frontend app root: `@/core/hooks`, `@/core/lib/api` (Next.js web app only)
- Relative imports: `../`, `./` — Used when traversing parent directories in same app

## Error Handling

**Patterns:**
- Always use i18n keys for error messages (never hardcoded strings): `throw new NotFoundException('common.errors.brand_not_found')`
- HTTP exceptions from `@nestjs/common`: `NotFoundException`, `ConflictException`, `BadRequestException`
- `HttpExceptionI18nFilter` (in `apps/backend/src/app/i18n/`) auto-translates exception messages before HTTP response
- `ZodValidationI18nFilter` auto-translates Zod validation error messages with field paths
- Exception response format: `{ statusCode, message }` (auto-translated by filter)
- Validation errors: `{ statusCode: 422, message: 'Validation failed', errors: [{ field, message }] }`

**Backend patterns:**
```ts
// Always throw with i18n key, not hardcoded message
if (!brand) {
  throw new NotFoundException('common.errors.brand_not_found');
}

// Conflict detection
if (slugConflict) {
  throw new ConflictException('common.errors.brand_slug_conflict');
}
```

**Frontend patterns:**
- API errors normalized via `ApiError` type in `core/lib/api/api-error.ts`
- Form validation errors from Zod schemas shown via `fieldState.error?.message`
- Try/catch in mutation success handlers for graceful fallbacks

## Logging

**Framework:** `console` (Node.js console, no logger library detected)

**Patterns:**
- E2E tests log setup: `console.log('\nSetting up...\n')` in global setup
- eslint-disable comments used above logging when needed: `/* eslint-disable */`
- No structured logging framework detected; plain console calls for dev/test feedback

## Comments

**When to Comment:**
- JSDoc comments on public API functions with parameters and return types
- `/** ... */` format for complex helper functions (e.g., `createAuthClient()`, `uniqueEmail()`)
- Inline comments rare; code is self-documenting via clear naming

**JSDoc/TSDoc patterns:**
```ts
/**
 * Creates an axios instance with cookie jar support.
 * Each call returns a fresh instance with its own cookie store,
 * ensuring test isolation.
 */
export function createAuthClient(): AxiosInstance { ... }

/**
 * Generates a unique email for test isolation.
 * Format: test-{timestamp}-{random}@e2e.test
 */
export function uniqueEmail(): string { ... }
```

Comments describe the "why" and "what", not the "how":
- Explain non-obvious behavior: test isolation, cookie jar, fresh instances
- Explain format/constraints: email format for tests, phone format (Turkish mobile)
- Avoid restating code: `const x = 5; // Set x to 5` is bad

## Function Design

**Size:** Functions are small and focused. Backend service methods typically 10-30 lines, with clear single responsibility.

**Parameters:**
- Named parameters using objects: `async getBrands(query: BrandQueryDTO)`
- Complex options destructured: `async lookup(opts: { q?: string; ids?: string[]; limit: number; page: number; lang: Locale })`
- Avoid parameter lists longer than 3-4 items; use object destructuring instead

**Return Values:**
- Always explicit return types: `Promise<PaginatedResponse<AdminBrandListPrismaType>>`
- Async generators for iteration: `async *iterateBrands(...): AsyncGenerator<AdminBrandListPrismaType[]>`
- Never implicit `any` return types
- Cursor-based pagination: yield batches, return cursor position for continuation

**Error handling:**
- Functions throw exceptions rather than returning error objects
- All async functions wrapped in try/catch at service layer
- Null checks before operations: `if (!brand) throw new NotFoundException(...)`

## Module Design

**Exports:**
- Services exported as classes with `@Injectable()` decorator (NestJS)
- Controllers exported as classes with `@Controller()` decorator
- DTOs exported as classes extending ZodDto
- Utilities exported as named functions or constants
- Barrel exports in `index.ts` files when grouping related exports (rare, most imports direct)

**Barrel Files:**
- `index.ts` used minimally: `apps/backend/src/core/decorators/index.ts` exports all decorators
- Prefer direct imports: `import { BrandsService } from './brands.service'` not `import { BrandsService } from './'`
- Exception: `packages/types` and `packages/schemas` use barrel exports for organized namespace access

**NestJS Module Pattern:**
- Controllers register endpoints, use `@ApiTags`, `@ApiOperation` for Swagger
- Services handle business logic, always decorated with `@Injectable()`
- DTOs created via `createZodDto(Schema)` with `ZodDto` type cast
- Modules import dependencies, register providers/controllers in `@Module()` decorator
- Dependency injection via constructor injection: `constructor(private readonly brandsService: BrandsService) {}`

## Type Safety

**TypeScript patterns:**
- `type` alias for objects and unions, `interface` for contracts (rarely used)
- `as const` for tuple assertions: `{ sortOrder: 'asc' } as const satisfies Prisma.BrandOrderByWithRelationInput`
- Type guards via narrowing: `if (typeof exceptionResponse === 'string')`
- Prisma type inference: `type AdminBrandListPrismaType = Prisma.BrandGetPayload<{ include: typeof AdminBrandListPrismaQuery }>`

**Frontend type patterns:**
- InputType / OutputType from Zod schemas: `type LoginSchemaOutputType` used in mutations
- Generic components typed with `<T>`: `DataTable<MyType>`, `useMutation<TData, TError>`
- Strict null checks enabled (inferred from TypeScript settings)

---

*Convention analysis: 2026-02-27*
