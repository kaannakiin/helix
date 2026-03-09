# Architecture

**Analysis Date:** 2026-03-09

## Pattern Overview

**Overall:** Nx Monorepo with multi-app architecture (Admin Portal + Backend API + Storefront Router + B2C/B2B Storefronts)

**Key Characteristics:**
- Nx-managed monorepo with `packages/*` shared libraries and `apps/*` deployable applications
- NestJS backend serving both admin and storefront APIs behind a unified `/api` prefix
- Next.js admin portal (App Router) consuming the backend via REST
- Fastify-based storefront router that resolves domains to stores and proxies to B2C/B2B Next.js storefronts
- Caddy reverse proxy handles TLS and routes admin vs storefront traffic
- Shared packages for schemas (Zod), types, constants, UI components, i18n, hooks, and utilities

## Layers

**Reverse Proxy (Caddy):**
- Purpose: TLS termination, admin vs storefront routing
- Location: `Caddyfile`
- Contains: Route rules for portal (`PORTAL_HOSTNAME` -> admin portal + backend API) and wildcard `:443` (storefront traffic -> router)
- Depends on: Backend API (for on-demand TLS verification), Portal, Router
- Used by: All external HTTP traffic

**Admin Portal (Next.js App Router):**
- Purpose: Admin dashboard for managing products, categories, stores, customers, organizations, etc.
- Location: `apps/portal/`
- Contains: Next.js pages, React components, hooks, stores, API client, i18n config
- Depends on: `@org/ui`, `@org/schemas`, `@org/types`, `@org/constants`, `@org/hooks`, `@org/utils`, `@org/i18n`
- Used by: Admin users via browser

**Backend API (NestJS):**
- Purpose: REST API for admin CRUD operations, storefront auth, file uploads, exports, geolocation
- Location: `apps/backend/`
- Contains: NestJS modules (controllers, services, DTOs, guards, strategies, pipes, interceptors)
- Depends on: `@org/prisma`, `@org/schemas`, `@org/types`, `@org/constants`, `@org/utils`, `@org/i18n`
- Used by: Admin Portal (client-side via `apiClient`, server-side via `serverFetch`), Storefront Router (domain resolution)

**Storefront Router (Fastify):**
- Purpose: Domain-based routing — resolves incoming hostname to a store, determines B2C or B2B business model, and proxies to the correct storefront upstream
- Location: `apps/storefront-router/`
- Contains: Fastify plugins for routing, domain resolution cache, upstream health checks
- Depends on: Backend API (for domain resolution via `/.well-known/helix-routing`)
- Used by: Caddy (proxies storefront traffic here)

**B2C Storefront (Next.js):**
- Purpose: Customer-facing B2C storefront
- Location: `apps/b2c-storefront/`
- Contains: Minimal scaffold (early development stage)
- Depends on: `@org/i18n`
- Used by: End customers via storefront router

**B2B Storefront (Next.js):**
- Purpose: Customer-facing B2B storefront
- Location: `apps/b2b-storefront/`
- Contains: Minimal scaffold (early development stage)
- Depends on: `@org/i18n`
- Used by: End customers via storefront router

**Shared Packages:**
- Purpose: Reusable code shared across applications
- Location: `packages/`
- Contains: 8 packages — `prisma`, `schemas`, `types`, `constants`, `ui`, `i18n`, `hooks`, `utils`

## Data Flow

**Admin CRUD (e.g., Products):**

1. Portal page (`apps/portal/app/(admin)/products/page.tsx`) renders a `DataTable` with an `IDatasource`
2. `DataTable` calls `apiClient.post('/admin/products/query', query)` with filter/sort/pagination params
3. `apiClient` (from `@org/utils/http/create-api-client`) sends request with cookies to backend
4. NestJS `ProductsController.getProducts()` receives the DTO, validated by `ZodValidationPipe`
5. Controller delegates to `ProductsService.getProducts()` which uses `buildPrismaQuery()` to convert filter/sort params to Prisma query
6. Service queries PostgreSQL via `PrismaService` and returns `PaginatedResponse<T>`
7. Response flows back through controller -> interceptors -> HTTP response -> `apiClient` -> `DataTable`

**Admin Server-Side Data Fetching:**

1. Portal server component imports `serverFetch` from `apps/portal/core/lib/api/server-fetch.ts`
2. `serverFetch` reads access token from cookies, adds `Accept-Language` header from request
3. Calls backend API directly via internal URL (`BACKEND_INTERNAL_URL`)
4. If 401, redirects to `/auth?tab=login`

**Storefront Domain Resolution:**

1. Customer visits `store-domain.com` -> Caddy routes to storefront router (:3100)
2. Router's `routerPlugin` extracts `req.hostname` and calls `resolveCache.resolve(hostname)`
3. Cache queries backend API at `/.well-known/helix-routing?hostname=...` to get store ID, slug, name, and business model (B2C/B2B)
4. Router injects `x-store-id`, `x-store-slug`, `x-store-name`, `x-business-model` headers
5. Proxies request to appropriate upstream (B2C or B2B Next.js app) via `http-proxy`

**Authentication (Admin):**

1. Login via `POST /api/admin/auth/login` with email/password (LocalStrategy)
2. Or OAuth via Google/Facebook/Instagram strategies (conditionally loaded)
3. `AuthService` validates credentials, `TokenService` creates JWT access + refresh tokens
4. Access token set as httpOnly cookie (`ACCESS_TOKEN_COOKIE_NAME`)
5. `JwtAuthGuard` (global APP_GUARD) protects all admin routes; `@Public()` decorator exempts specific endpoints
6. Portal reads user from `x-user-*` headers (set by middleware/proxy) in server components, hydrates `useAuthStore` (Zustand + immer) via `AuthProvider`

**State Management:**
- Server state: Zustand with immer middleware for auth (`apps/portal/core/stores/auth.store.ts`)
- Server cache: React Query (TanStack Query) via `QueryProvider` for API data caching
- Form state: React Hook Form with `useTranslatedZodResolver` for Zod schema validation
- Table state: ag-grid infinite row model with server-side datasource pattern

## Key Abstractions

**Prisma Query Builder:**
- Purpose: Converts DataTable filter/sort/search parameters into Prisma `where`/`orderBy` clauses
- Location: `apps/backend/src/core/utils/prisma-query-builder.ts`
- Pattern: Utility functions (`buildPrismaQuery`, `resolveCountFilters`) that translate generic filter types (text, number, date, boolean, enum) to Prisma query objects. Count filters use raw SQL subqueries.

**Schema Pattern (Base/Frontend/Backend):**
- Purpose: Share validation logic between frontend forms and backend DTOs while handling file upload differences
- Location: `packages/schemas/src/admin/*/`
- Pattern: `BaseFooSchema` (no `.check()`) -> `FooSchema` (extends with `images` field + `.check()` for frontend) -> `BackendFooSchema` (`.check()` without images for backend). Always use `.safeExtend()` instead of `.extend()`.
- Reference: `packages/schemas/src/admin/categories/category-zod-schema.ts`

**DataTable System:**
- Purpose: Reusable server-side paginated, filterable, sortable data grid
- Location: `packages/ui/src/data-table/`
- Pattern: `useColumnFactory` creates typed column definitions, `serializeGridQuery` converts ag-grid params to API query format, `IDatasource` implements ag-grid infinite row model

**API Client Pair (Client/Server):**
- Purpose: Two fetch wrappers for client-side and server-side API calls
- Client: `apps/portal/core/lib/api/api-client.ts` — uses `@org/utils/http/create-api-client` with auto-refresh on 401
- Server: `apps/portal/core/lib/api/server-fetch.ts` — uses `@org/utils/http/create-server-fetch` with cookie forwarding and redirect on auth failure

**NestJS Module Pattern:**
- Purpose: Each domain area is a self-contained NestJS module
- Location: `apps/backend/src/app/admin/{domain}/`
- Pattern: Each module contains `{domain}.module.ts`, `{domain}.controller.ts`, `{domain}.service.ts`, and `dto/` directory with Zod-based DTOs via `nestjs-zod`

**i18n System:**
- Purpose: Multi-locale support with separate namespaces per app
- Location: `packages/i18n/src/locales/{locale}/` (shared validation/backend), `apps/portal/core/i18n/` (portal-specific)
- Pattern: 3 namespaces — `validation.json`, `backend.json`, `portal.json`. Portal loads `validation` + `portal` (as `frontend`). Backend loads all via `nestjs-i18n`. Error keys are i18n message keys (e.g., `'backend.errors.product_not_found'`).

## Entry Points

**Backend API:**
- Location: `apps/backend/src/main.ts`
- Triggers: `nx serve backend` / `npm start`
- Responsibilities: Creates NestJS app, configures CORS (dynamic in production via `CorsOriginService`), cookie parser, helmet, Swagger (dev only), global prefix `/api`, listens on port 3003

**Admin Portal:**
- Location: `apps/portal/app/layout.tsx`
- Triggers: `nx dev portal`
- Responsibilities: Root layout wrapping all pages with `QueryProvider` -> `AuthProvider` -> `NextIntlClientProvider` -> `MantineProvider` -> `ModalsProvider` -> `LocaleProvider`

**Storefront Router:**
- Location: `apps/storefront-router/src/main.ts`
- Triggers: `nx serve storefront-router`
- Responsibilities: Fastify server with `routerPlugin` (domain resolution + proxying) and `healthPlugin`, listens on port 3100

**B2C Storefront:**
- Location: `apps/b2c-storefront/src/app/layout.tsx`
- Triggers: `nx dev b2c-storefront`

**B2B Storefront:**
- Location: `apps/b2b-storefront/app/layout.tsx`
- Triggers: `nx dev b2b-storefront`

## Error Handling

**Strategy:** i18n-aware error translation at the API boundary

**Patterns:**
- Backend throws NestJS HTTP exceptions with i18n message keys: `throw new NotFoundException('backend.errors.product_not_found')`
- `HttpExceptionI18nFilter` (`apps/backend/src/app/i18n/http-exception-i18n.filter.ts`) catches HTTP exceptions and translates the message key using `nestjs-i18n` based on `Accept-Language` or `x-lang` header
- `ZodValidationI18nFilter` (`apps/backend/src/app/i18n/zod-validation-i18n.filter.ts`) catches Zod validation errors and translates validation keys
- `ZodValidationPipe` (global) validates all incoming DTOs against Zod schemas
- `ZodSerializerInterceptor` (global) serializes outgoing responses
- Frontend forms use `useTranslatedZodResolver` from `@org/hooks` to translate Zod validation errors client-side

## Cross-Cutting Concerns

**Logging:** NestJS built-in `Logger` on backend; Fastify logger on storefront router; `console` on portal

**Validation:** Zod schemas shared via `@org/schemas` package. Backend uses `nestjs-zod` (`ZodValidationPipe` as global APP_PIPE). Frontend uses `useTranslatedZodResolver` with React Hook Form.

**Authentication:** JWT-based with httpOnly cookies. Admin uses Passport strategies (local, JWT, refresh, Google, Facebook, Instagram). Global `JwtAuthGuard` with `@Public()` decorator for open routes. Storefront has separate auth module (`StorefrontAuthModule`).

**Content Locale:** `ContentLocaleInterceptor` + `@ContentLocale()` decorator extract content locale from headers for multi-language data queries. Separate from UI locale.

**File Upload:** MinIO object storage. `UploadService` handles file upload/deletion. `FileValidationPipe` validates file types. Images have polymorphic ownership (product, productVariant, productVariantGroupOption).

**Export:** Generic `ExportService` (`apps/backend/src/app/export/`) generates Excel/CSV exports using cursor-based iteration and streaming responses.

---

*Architecture analysis: 2026-03-09*
