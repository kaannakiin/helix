# Architecture

**Analysis Date:** 2026-02-27

## Pattern Overview

**Overall:** Modular monorepo (Nx) with separate frontend (Next.js) and backend (NestJS) applications sharing libraries. Clean separation of concerns: domain logic in backend, presentation in frontend.

**Key Characteristics:**
- RESTful API with JWT auth + refresh token rotation
- Server-side pagination, filtering, sorting via DataTable queries
- Multi-language support (i18n) on both backend and frontend
- Shared Prisma client across apps via `@org/prisma` package
- Zod schema validation shared between frontend and backend
- Token payload forwarded via headers from frontend middleware to backend context

## Layers

**API Layer (`apps/backend/src/main.ts`):**
- Purpose: Express application bootstrap with middleware setup
- Location: `apps/backend/src/main.ts`
- Contains: Global guards, pipes, filters, error handling, CORS/helmet/body parser config
- Depends on: NestJS, helmet, cookie-parser, Swagger
- Used by: Application runtime

**Controller Layer (`apps/backend/src/app/*/[entity].controller.ts`):**
- Purpose: HTTP request routing and response serialization
- Location: `apps/backend/src/app/auth/auth.controller.ts`, `apps/backend/src/app/admin/brands/brands.controller.ts` (pattern)
- Contains: Route decorators, request guards (@Roles, @Public), DTO validation, response formatting
- Depends on: Services, DTOs, Decorators
- Used by: Incoming HTTP requests

**Service Layer (`apps/backend/src/app/*/[entity].service.ts`):**
- Purpose: Business logic, database queries, data transformations
- Location: `apps/backend/src/app/auth/auth.service.ts`, `apps/backend/src/app/admin/brands/brands.service.ts` (pattern)
- Contains: Query logic, mutations, relationships, filtering/sorting, pagination
- Depends on: PrismaService, types from `@org/types`, `@org/schemas`
- Used by: Controllers

**Data Access Layer (Prisma):**
- Purpose: Database schema and ORM client
- Location: `packages/prisma/prisma/schema/` (multi-file schema), generated client output to `packages/prisma/src/generated/prisma`
- Contains: Model definitions, migrations, indexes, relationships
- Depends on: PostgreSQL database
- Used by: Services via PrismaService

**Shared Types Layer (`packages/types/src/admin/*/index.ts`):**
- Purpose: Type inference from Prisma includes, field configs for DataTable
- Location: `packages/types/src/admin/{entity}/index.ts`
- Contains: `AdminBrandListPrismaQuery` (Prisma include), `AdminBrandListPrismaType` (inferred type), field filter config, sort field lists
- Depends on: Prisma client
- Used by: Services, frontend DataTable

**Validation Layer (`packages/schemas/src/admin/*/`):**
- Purpose: Zod schemas for request validation and frontend forms
- Location: `packages/schemas/src/admin/{entity}/`
- Contains: Query schema (via `createDataQuerySchema()`), save schema, export schema
- Depends on: Zod, common validation building blocks
- Used by: DTOs (backend), useForm (frontend)

**Frontend Pages Layer (`apps/web/app/(route-group)/*/page.tsx`):**
- Purpose: Next.js page components with server/client boundaries
- Location: `apps/web/app/(admin)/admin/products/page.tsx` (example)
- Contains: Layout, page-level logic, RSC fetches via `serverFetch()`
- Depends on: React components, hooks, providers
- Used by: Next.js router

**Frontend Component Layer (`apps/web/app/(route-group)/*/components/`):**
- Purpose: Reusable React components (DataTable, forms, modals)
- Location: `apps/web/app/(admin)/admin/customers/components/` (if exists), shared in `core/ui/components/`
- Contains: Form components, DataTable wrappers, layout components marked `'use client'`
- Depends on: Mantine, react-hook-form, React Query hooks
- Used by: Pages

**Client State Management (`apps/web/core/stores/`):**
- Purpose: Client-side state via Zustand
- Location: `apps/web/core/stores/auth.store.ts`
- Contains: Auth state (user, isAuthenticated), store methods (initializeUser, logout)
- Depends on: Zustand, immer middleware
- Used by: Auth provider, useAuthStore hook

**Server State Management (React Query):**
- Purpose: Server data fetching, caching, synchronization
- Location: `apps/web/core/hooks/` (mutation/query hooks)
- Contains: `useQuery`, `useMutation` wrappers with `apiClient` or `serverFetch()`
- Depends on: `@tanstack/react-query`, apiClient
- Used by: Page/component hooks

**HTTP Client Layer (`apps/web/core/lib/api/`):**
- Purpose: Axios client with interceptors for token refresh
- Location: `apps/web/core/lib/api/api-client.ts`
- Contains: Axios instance with baseURL `/api`, 401 response interceptor for token refresh, error queue management
- Depends on: axios
- Used by: React Query hooks

**i18n Layer (`packages/i18n/src/locales/`):**
- Purpose: Locale files (en, tr) shared between backend and frontend
- Location: `packages/i18n/src/locales/{en,tr}/{backend.json,frontend.json,validation.json}`
- Contains: UI strings, error messages, validation messages
- Depends on: nestjs-i18n (backend), next-intl (frontend)
- Used by: Exception filters (backend), useTranslations hook (frontend)

## Data Flow

**Authentication Flow:**

1. User logs in → `POST /auth/login` (public endpoint)
2. Backend validates credentials → generates JWT + refresh token → sets access token in secure cookie → returns user payload
3. Frontend receives user payload → stores in Zustand auth store
4. Middleware (`apps/web/middleware.ts`) extracts cookie → decodes JWT → passes as `X-User-*` headers to next request
5. Root layout reads headers → initializes AuthProvider with `TokenPayload`
6. Subsequent requests include access token via axios interceptor or middleware header forwarding

**Admin DataTable Query Flow:**

1. Frontend renders page with columns (via `useColumnFactory()`) and datasource
2. AG-Grid infinite scroll triggers `datasource.getRows(params)` with `startRow`, `endRow`, `filterModel`, `sortModel`
3. Frontend serializes params via `serializeGridQuery()` → produces `{ page, limit, filters?, sort? }`
4. Frontend POSTs to `/admin/{entity}/query` with JSON body
5. Backend controller validates via `BrandQueryDTO` (Zod schema) → calls service method
6. Service uses `buildPrismaQuery()` to convert filter/sort into Prisma `where`, `orderBy`, `skip`, `take`
7. Service executes parallel queries: `findMany()` (data) + `count()` (total)
8. Backend returns `{ data: [], pagination: { total, page, limit, totalPages } }`
9. Frontend passes data to AG-Grid → renders infinite rows with sorting/filtering

**Admin Save (Create/Update) Flow:**

1. Frontend form submits via mutation: `useMutation(() => apiClient.post('/admin/{entity}/save', data))`
2. Backend controller validates via `BrandSaveDTO` (Zod schema)
3. Service handles create/update logic: Prisma `upsert()` or `createMany()` + `updateMany()`
4. Backend returns saved entity with full includes (relations)
5. Frontend receives response → invalidates React Query cache via `queryClient.invalidateQueries()`
6. Dependent queries re-fetch automatically

**Lookup (Selection Input) Flow:**

1. Frontend calls `GET /admin/{entity}/lookup?q=...&ids=...&limit=50`
2. Backend controller receives query params + locale (from `@Locale()` decorator)
3. Service determines mode:
   - **ID Resolve:** `ids` present → fetch by ID without `isActive` filter
   - **Search:** `q` present → search by translated name with `isActive: true` filter
4. Returns array of `LookupItem[]` with `{ id, label, image? }`
5. Frontend renders in selection input (Combobox)

**Export Flow:**

1. Frontend calls `GET /admin/{entity}/export?format=excel&filters=...&sort=...`
2. Backend controller calls service method `*iterateXs()` (async generator)
3. Generator yields batches of data via cursor-based pagination (not offset)
4. Backend ExportService writes to Excel/CSV
5. Response headers set `Content-Disposition: attachment`
6. Frontend downloads file

## Key Abstractions

**DTOs (Data Transfer Objects):**
- Purpose: Validate and shape incoming request data
- Examples: `BrandQueryDTO`, `BrandSaveDTO`, `BrandExportQueryDTO` in `apps/backend/src/app/admin/brands/dto/`
- Pattern: Extend `createZodDto(schema)` with `ZodDto` type cast. Three DTO types per entity.

**Prisma Include Queries:**
- Purpose: Reusable database include patterns with inferred types
- Examples: `AdminBrandListPrismaQuery`, `AdminBrandListPrismaType` in `packages/types/src/admin/brands/index.ts`
- Pattern: Define as `const` with `satisfies Prisma.{Entity}Include`, infer type via `Prisma.{Entity}GetPayload<{ include }>`

**Field Config & Sort Fields:**
- Purpose: Declare which fields are filterable/sortable at the type level
- Examples: `BRAND_FIELD_CONFIG`, `BRAND_SORT_FIELDS` in `packages/types/src/admin/brands/index.ts`
- Pattern: Used to generate Zod schema via `createDataQuerySchema()`

**Export Column Definitions:**
- Purpose: Declare Excel/CSV column layout with header keys, field paths, types
- Examples: `BRAND_EXPORT_COLUMNS` in `apps/backend/src/app/admin/brands/brands.export-config.ts`
- Pattern: Array of `ExportColumnDef` with field, headerKey, type (text/number/boolean/date/datetime/badge), width

**Lookup Items:**
- Purpose: Serialized data for selection inputs (search/resolve)
- Pattern: `{ id, label, image? }` returned as array or paginated response
- Used by: Frontend combobox, relation inputs

**Token Payload:**
- Purpose: JWT claims passed through request headers
- Type: `TokenPayload` in `packages/types/src/token/index.ts`
- Forwarded via: Middleware `X-User-*` headers → root layout → AuthProvider → useAuthStore

## Entry Points

**Backend Bootstrap:**
- Location: `apps/backend/src/main.ts`
- Triggers: `npm run serve`
- Responsibilities: Instantiate NestJS app, apply global middleware/filters/pipes, setup Swagger, bind to port 3001

**Frontend Root Layout:**
- Location: `apps/web/app/layout.tsx`
- Triggers: Every Next.js request (server component)
- Responsibilities: Extract user from headers, wrap app in providers (Query, Auth, i18n, Mantine), set HTML/body attributes

**Frontend Middleware:**
- Location: `apps/web/middleware.ts`
- Triggers: Every request before routing
- Responsibilities: Verify JWT from cookie, decode payload, forward as `X-User-*` headers to next layer

**Admin Module:**
- Location: `apps/backend/src/app/admin/admin.module.ts`
- Triggers: App bootstrap imports AdminModule
- Responsibilities: Register all admin entity modules (Brands, Products, Categories, etc.)

**Auth Module:**
- Location: `apps/backend/src/app/auth/auth.module.ts`
- Triggers: App bootstrap imports AuthModule
- Responsibilities: Register AuthService, SessionService, DeviceService; import Passport strategies

## Error Handling

**Strategy:** i18n-aware exception filters that translate error messages before sending HTTP response.

**Patterns:**

- **HTTP Exceptions:** Throw with i18n key as message (e.g., `throw new NotFoundException('backend.errors.brand_not_found')`)
- **Filter Translation:** `HttpExceptionI18nFilter` intercepts exception → translates message via i18n service → sends JSON response
- **Validation Errors:** `ZodValidationI18nFilter` catches Zod validation pipe errors → translates field errors via i18n
- **Frontend Error Handling:** `ApiError` class wraps status + message + fieldErrors; `apiClient` response interceptor catches 401 for token refresh
- **HTTP Status Codes:** 200 (success), 201 (created), 400 (bad request), 401 (unauthorized), 403 (forbidden), 404 (not found), 409 (conflict), 422 (validation error)

## Cross-Cutting Concerns

**Logging:** No centralized logger visible; likely using NestJS default console logging.

**Validation:**
- Backend: Zod via `ZodValidationPipe` (global)
- Frontend: Zod via `zodResolver()` in react-hook-form

**Authentication:**
- JWT with refresh token rotation (token family tracking)
- Passport strategies: JwtStrategy, LocalStrategy, GoogleAuthGuard, FacebookAuthGuard, InstagramAuthGuard
- Guards: `JwtAuthGuard`, `JwtRefreshGuard`, custom `@Roles()` decorator for role-based access

**Authorization:**
- Role-based via `@Roles(UserRole.ADMIN, ...)` decorator on controllers
- `@Public()` decorator to skip JWT guard

**i18n:**
- Backend: `nestjs-i18n` with locale files in `@org/i18n`; `@Locale()` decorator converts request language to Prisma enum
- Frontend: `next-intl` with request handler at `apps/web/core/i18n/request.ts`

**Caching:**
- Frontend server-side: None explicit (RSC fetches per request)
- Frontend client-side: React Query cache per query key
- Backend database: Prisma client in-memory cache (default behavior)

**CORS:** Enabled in bootstrap; origin from env var in prod, wildcard in dev.

**Security:** Helmet middleware applied; cookie-based JWT; CSRF protection via SameSite cookie attribute (default secure).

---

*Architecture analysis: 2026-02-27*
