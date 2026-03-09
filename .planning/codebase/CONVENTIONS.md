# Coding Conventions

**Analysis Date:** 2026-03-09

## Naming Patterns

**Files:**
- Use kebab-case for all file names: `categories.controller.ts`, `category-zod-schema.ts`, `auth.store.ts`
- Suffix files by role: `.controller.ts`, `.service.ts`, `.module.ts`, `.guard.ts`, `.pipe.ts`, `.decorator.ts`, `.interceptor.ts`
- Schema files: `{entity}-zod-schema.ts` in `packages/schemas/src/`
- DTO files: `{entity}-{purpose}.dto.ts` in `dto/` subdirectories
- Hook files: `use{PascalCase}.ts` (e.g., `useAdminCategory.ts`, `useImageUpload.ts`)
- Spec files: co-located, same name with `.spec.ts` suffix

**Functions:**
- Use camelCase for all functions and methods: `getCategories()`, `saveCategory()`, `buildPrismaQuery()`
- Hooks: prefix with `use`: `useAdminCategory()`, `useTranslatedZodResolver()`
- Factory functions: prefix with `create`: `createApiClient()`, `createAuthClient()`, `createZodDto()`
- Helper/utility functions: descriptive verbs: `findDuplicates()`, `matchesMimePattern()`
- Mutation hooks: `useSave{Entity}()` pattern

**Variables:**
- Use camelCase: `cleanParentId`, `existingImageIds`, `slugConflict`
- Constants: UPPER_SNAKE_CASE: `MAX_CATEGORY_IMAGES`, `DEFAULT_PASSWORD`, `DEFAULT_MAX_SIZE`
- Exported constant objects: UPPER_SNAKE_CASE: `DATA_ACCESS_KEYS`, `NEW_CATEGORY_DEFAULT_VALUES`

**Types:**
- Use PascalCase for all types and interfaces: `CategoryInput`, `CategoryOutput`, `AuthState`
- Zod schema exports: PascalCase with `Schema` suffix: `CategorySchema`, `BaseCategorySchema`, `BackendCategorySchema`
- Type exports derived from schemas: `z.input<typeof Schema>` → `{Entity}Input`, `z.output<typeof Schema>` → `{Entity}Output`
- DTO classes: PascalCase with `DTO` suffix: `CategorySaveDTO`, `CategoryQueryDTO`
- Prisma query types: `Admin{Entity}{Action}PrismaType` (e.g., `AdminCategoryDetailPrismaType`)

**Enums:**
- Use Prisma-generated enums directly from `@org/prisma/client` or `@org/prisma/browser`
- Never re-define enums that exist in Prisma

## Code Style

**Formatting:**
- Prettier with `singleQuote: true` (config at `.prettierrc`)
- No other custom Prettier settings (uses defaults: 80 char width, trailing commas, etc.)

**Linting:**
- ESLint 9 flat config at `eslint.config.mjs`
- Uses `@nx/eslint-plugin` with flat/base, flat/typescript, flat/javascript configs
- `@nx/enforce-module-boundaries` rule enforced (error level)
- Minimal custom rules; relies on Nx defaults

**TypeScript:**
- Strict mode enabled (`"strict": true` in `tsconfig.base.json`)
- `noImplicitReturns: true`, `noImplicitOverride: true`, `noFallthroughCasesInSwitch: true`
- Module resolution: `nodenext`
- Target: `es2022`

## Import Organization

**Order:**
1. Framework imports (`@nestjs/*`, `react`, `next/*`)
2. External library imports (`@tanstack/*`, `@mantine/*`, `axios`, `zod`)
3. Workspace package imports (`@org/schemas/*`, `@org/types/*`, `@org/constants/*`, `@org/prisma/*`, `@org/ui/*`, `@org/hooks/*`, `@org/utils/*`)
4. Relative imports (`../`, `./`)
5. Type-only imports use `import type` syntax

**Path Aliases:**
- `@org/*` — workspace packages (defined via npm workspaces + tsconfig paths)
- `@/` — app-local alias in Next.js apps (e.g., `@/core/hooks/useAdminCategory`)
- Always use `.js` extension for relative imports in packages (ESM/nodenext resolution): `'./validation-keys.js'`

## Zod Schema Conventions (Critical)

**Base Schema Pattern:**
Every entity schema follows a 4-part pattern (reference: `packages/schemas/src/admin/categories/category-zod-schema.ts`):

1. `Base{Entity}Schema` — plain `z.object({...})` without `.check()` refinements
2. `check{Entity}` function — standalone validation logic receiving `{ issues, value }`
3. `{Entity}Schema` — `Base{Entity}Schema.safeExtend({images: ...}).check(checkFn)` — for frontend (includes dropzone file fields)
4. `Backend{Entity}Schema` — `Base{Entity}Schema.check(checkFn)` — for backend DTOs (no file fields)

**Key rules:**
- Never use `.omit()` on schemas with `.check()` refinements (Zod v4 runtime error)
- Always use `.safeExtend()` instead of `.extend()` (`.extend()` drops `.check()` refinements)
- Use `V` constants from `packages/schemas/src/common/validation-keys.ts` for all error messages
- Error messages are i18n keys, not raw strings: `{ error: V.NAME_REQUIRED }`
- Export `NEW_{ENTITY}_DEFAULT_VALUES` constant for form initialization
- Common building blocks live in `packages/schemas/src/common/common-schemas.ts` (`cuidSchema`, `slugSchema`, `dropzoneFileSchema`, `existingImageSchema`, `storesSchema`, etc.)

## DTO Pattern (Backend)

**Structure:**
DTOs wrap Zod schemas using `nestjs-zod`:

```typescript
import { BackendCategorySchema } from '@org/schemas/admin/categories';
import { createZodDto, type ZodDto } from 'nestjs-zod';

export class CategorySaveDTO extends (createZodDto(
  BackendCategorySchema
) as ZodDto<typeof BackendCategorySchema, false>) {}
```

- Save DTOs use `Backend{Entity}Schema` (no file upload fields)
- Query DTOs use dedicated query schemas
- Each domain has a `dto/index.ts` barrel file
- DTO directory: `apps/backend/src/app/admin/{entity}/dto/`

## NestJS Backend Patterns

**Controller conventions:**
- Class decorators: `@ApiTags('Admin - {Entity}')`, `@Controller('admin/{entity}')`, `@UseInterceptors(ContentLocaleInterceptor)`
- Constructor injection with `private readonly` for all dependencies
- List endpoint: `@Post('query')` — accepts query body (not GET with query params)
- Lookup endpoint: `@Get('lookup')` — for selection dropdowns
- Detail endpoint: `@Get(':id')`
- Upsert endpoint: `@Post('save')` — single endpoint for create/update using `uniqueId`
- Image upload: `@Post(':id/images')` with `@UseInterceptors(FileInterceptor('file'))`
- Image delete: `@Delete(':id/images/:imageId')` with `@HttpCode(HttpStatus.NO_CONTENT)`
- Export endpoint: `@Get('export')` — streams file response

**Service conventions:**
- `@Injectable()` decorator on all services
- Inject `PrismaService` for database access, `UploadService` for file operations
- Use NestJS HTTP exceptions with i18n keys: `throw new NotFoundException('backend.errors.category_not_found')`
- Error message format: `'backend.errors.{entity}_{error_type}'`
- Paginated responses return `PaginatedResponse<T>` with `{ data, pagination: { total, page, limit, totalPages } }`
- `saveCategory()`-style upsert methods handle uniqueId-based create/update in `$transaction`
- Cursor-based iteration via `async *iterate{Entity}()` generator for exports

**Module conventions:**
- Import shared modules: `PrismaModule`, `ExportModule`, `UploadModule`
- Register controller and service providers
- File: `apps/backend/src/app/admin/{entity}/{entity}.module.ts`

## Frontend (Portal) Patterns

**Page component conventions:**
- `'use client'` directive at top of page files
- Default export: `const Admin{Entity}FormPage = () => { ... }; export default Admin{Entity}FormPage;`
- Use `react-hook-form` with `FormProvider` and `Controller` for all forms
- Use `useTranslatedZodResolver` from `@org/hooks` (never raw `zodResolver`)
- Translations via `useTranslations('frontend.admin.{entity}.form')`
- Notifications via `@mantine/notifications` (`notifications.show({...})`)
- Image upload flow: save form data first, upload images separately via `useImageUpload` hook
- Navigation: `useRouter().push()` for programmatic navigation

**React Query conventions:**
- Query keys from `DATA_ACCESS_KEYS` constant in `@org/constants/data-keys`
- Pattern: `DATA_ACCESS_KEYS.admin.{entity}.list` / `.detail(id)` / `.lookup`
- Hooks in `apps/portal/core/hooks/useAdmin{Entity}.ts`
- `useAdmin{Entity}(id)` for detail queries, `useSave{Entity}()` for mutations
- On mutation success: `removeQueries` for detail + `invalidateQueries` for list
- API calls via `apiClient` from `apps/portal/core/lib/api/api-client.ts`

**State management:**
- Zustand with `immer` middleware for global state: `apps/portal/core/stores/auth.store.ts`
- Pattern: `create<State>()(immer((set) => ({ ... })))`

## Error Handling

**Backend:**
- Use NestJS built-in exceptions: `NotFoundException`, `ConflictException`, `BadRequestException`, `ForbiddenException`
- All error messages are i18n translation keys: `'backend.errors.category_not_found'`
- Pipe-level validation errors use `|` separator for interpolation: `'backend.errors.file_too_large|{"max":"5MB"}'`
- Zod validation errors use `V.*` constants (resolved to `'validation.errors.*'` keys)

**Frontend:**
- `ApiError` class from `@org/utils/http/create-api-client` normalizes all HTTP errors
- Properties: `statusCode`, `fieldErrors`, convenience getters (`isValidation`, `isUnauthorized`, etc.)
- Auto token refresh on 401 with request queue (transparent to callers)
- On refresh failure: redirect to `/auth`
- Mutation error callbacks display notifications via Mantine

## i18n Conventions

**Namespace structure:** 3 JSON files per locale (`en/`, `tr/`):
- `validation.json` — Zod validation error messages (shared across all apps)
- `backend.json` — NestJS backend error/success messages (server-side only)
- `portal.json` / `b2b.json` / `b2c.json` — per-app frontend UI strings

**Usage patterns:**
- Backend: `I18nContext.current()?.translate('backend.export.boolean_yes')`
- Frontend: `useTranslations('frontend.admin.categories.form')`
- Validation: `V.EMAIL_INVALID = 'validation.errors.auth.email_invalid'` (constant, never changes)
- Form resolver: always use `useTranslatedZodResolver` which strips `validation.` prefix and translates

**Type safety:**
- `packages/i18n/src/types/messages.ts` defines typed interfaces per app: `PortalMessages`, `B2BMessages`, `B2CMessages`

## Logging

**Framework:** NestJS `Logger` class (backend)

**Patterns:**
- Inject `Logger` for service-level logging
- Use `Logger.prototype.warn()` for degraded-state warnings (e.g., missing config)
- Frontend: no structured logging framework; uses `console` implicitly

## Comments

**When to Comment:**
- JSDoc on exported helper functions in packages (e.g., `auth.helper.ts`)
- Inline comments for non-obvious business logic
- No excessive documentation on straightforward CRUD methods

**JSDoc/TSDoc:**
- Used sparingly, primarily on reusable utility/helper functions
- Not used on controller/service methods (Swagger `@ApiOperation` serves as documentation)

## Function Design

**Parameters:**
- Use options objects for 3+ parameters: `lookup(opts: { q?, ids?, limit, page, lang })`
- Use positional params for 1-2 parameters: `getCategoryById(id, locale)`

**Return Values:**
- Services return domain types directly (no wrapper DTOs for responses)
- Paginated: `Promise<PaginatedResponse<T>>`
- Single entity: `Promise<T>`
- Void operations: `Promise<void>`

## Module Design

**Exports:**
- Each package has `src/index.ts` barrel file
- Domain subdirectories may have `index.ts` barrels (e.g., `dto/index.ts`)
- Re-export pattern from barrel: `export { AuthSurface } from './auth-surface.decorator'`

**Barrel Files:**
- `dto/index.ts` — exports all DTOs for a domain
- `core/decorators/index.ts` — exports all custom decorators
- Package-level `src/index.ts` — public API of each workspace package

---

*Convention analysis: 2026-03-09*
