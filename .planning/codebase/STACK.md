# Technology Stack

**Analysis Date:** 2026-03-09

## Languages

**Primary:**
- TypeScript ~5.9.2 - All apps and packages (strict mode, `nodenext` module resolution)

**Secondary:**
- SQL (Prisma schema DSL) - Database schema definitions in `packages/prisma/prisma/schema/*.prisma`

## Runtime

**Environment:**
- Node.js 22 (specified in CI workflow `actions/setup-node`)

**Package Manager:**
- npm 11.8.0 (declared in root `package.json` `packageManager` field)
- Lockfile: `package-lock.json` (present, npm workspaces)

## Monorepo

**Tooling:**
- Nx 22.5.0 - Monorepo orchestration, task caching, task distribution
- Config: `nx.json` at workspace root
- npm workspaces (declared in root `package.json`: `packages/*`, `apps/*`, `applications/*`)
- Nx Cloud used in CI for distributed task execution

**Custom condition:** `@org/source` (in `tsconfig.base.json` `customConditions`) enables source-level imports between workspace packages during development.

## Apps

| App | Framework | Port | Purpose |
|-----|-----------|------|---------|
| `apps/backend` | NestJS 11 | 3003 | REST API server |
| `apps/portal` | Next.js 16 | 3000 | Admin dashboard |
| `apps/b2c-storefront` | Next.js 16 | 3200 | B2C customer storefront |
| `apps/b2b-storefront` | Next.js 16 | 3300 | B2B customer storefront |
| `apps/storefront-router` | Fastify 5 | 3100 | Domain-based reverse proxy routing to storefronts |
| `apps/backend-e2e` | Jest 30 | - | E2E tests for backend |

## Packages

| Package | Purpose |
|---------|---------|
| `packages/prisma` | Prisma Client 7.4, schema, seeds, DB access |
| `packages/schemas` | Zod 4.3 validation schemas shared across apps |
| `packages/i18n` | Localization files (en, tr) per app namespace |
| `packages/types` | Shared TypeScript types |
| `packages/ui` | Shared UI components (Mantine-based) |
| `packages/hooks` | Shared React hooks (react-hook-form integration) |
| `packages/constants` | Shared constants |
| `packages/utils` | Shared utilities (axios, dayjs, slugify) |

## Frameworks

**Core:**
- NestJS 11 - Backend API (`apps/backend/package.json`)
- Next.js 16 - Portal and storefronts (`apps/portal/package.json`, `apps/b2c-storefront/package.json`)
- Fastify 5 - Storefront router (`apps/storefront-router/package.json`)

**UI:**
- Mantine 8.3 - Component library for portal (`@mantine/core`, `@mantine/dates`, `@mantine/dropzone`, `@mantine/hooks`, `@mantine/modals`, `@mantine/notifications`, `@mantine/spotlight`)
- Lucide React - Icon library
- TipTap 3 - Rich text editor (peer dependency in `@org/ui`)
- AG Grid 35 - Data grid/table (`ag-grid-community`, `ag-grid-react`)
- dnd-kit - Drag and drop (`@dnd-kit/core`, `@dnd-kit/sortable`)
- XYFlow/React - Flow/decision-tree visualization (`@xyflow/react`)

**State Management:**
- Zustand 5 - Client-side state in portal
- TanStack React Query 5 - Server state / data fetching in portal
- Immer 11 - Immutable state updates
- React Hook Form 7 - Form management with `@hookform/resolvers`

**Validation:**
- Zod 4.3 - Schema validation across all apps (`packages/schemas`)
- nestjs-zod 5 - NestJS Zod integration (validation pipe, serializer interceptor)
- google-libphonenumber - Phone number validation in schemas

**Testing:**
- Jest 30 - Unit and integration tests
- Playwright 1.36 - E2E browser tests
- SWC/Jest - Fast TypeScript compilation for tests
- Faker.js 10 - Test data generation (in prisma seeds)

**Build/Dev:**
- Webpack 5 - Backend build (`webpack-cli`)
- esbuild 0.19 - Storefront router build (`@nx/esbuild`)
- SWC 1.15 - TypeScript compilation
- PostCSS 8.5 with Tailwind CSS 4.2 and Mantine PostCSS preset
- ESLint 9 with typescript-eslint
- Prettier 2

## Key Dependencies

**Critical:**
- `@prisma/client` 7.4 - Database ORM (with `@prisma/adapter-pg` for native pg driver)
- `zod` 4.3 - Validation (shared via `@org/schemas`)
- `next-intl` 4 - Frontend i18n (portal + storefronts)
- `nestjs-i18n` 10 - Backend i18n
- `passport` 0.7 - Authentication strategies (JWT, local, Google, Facebook, Instagram)
- `@nestjs/jwt` 11 - JWT token generation/verification
- `jose` 6 - JWT handling on frontend (portal)

**Infrastructure:**
- `ioredis` 5 - Redis client (caching, sessions, BullMQ backing)
- `bullmq` 5 - Job queue processing (evaluation jobs)
- `minio` 8 / `nestjs-minio` 2 - Object storage client
- `pg` 8 - PostgreSQL native driver (used with Prisma adapter)
- `http-proxy` 1 - HTTP proxying in storefront router

**Data/Export:**
- `exceljs` 4 - Excel file generation
- `@fast-csv/format` 5 - CSV formatting
- `axios` 1 - HTTP client (utils, portal)
- `dayjs` 1 - Date manipulation

**Security:**
- `helmet` 8 - HTTP security headers
- `@node-rs/argon2` 2 - Password hashing
- `cookie-parser` 1 - Cookie parsing
- `ua-parser-js` 2 - User-agent parsing (device tracking)

## Configuration

**Environment:**
- `@nestjs/config` with `ConfigModule.forRoot({ isGlobal: true })` in `apps/backend/src/app/app.module.ts`
- Environment variables loaded via `ConfigService.getOrThrow()` / `ConfigService.get()`
- `.env` files present but gitignored (never read contents)

**Required env vars (from docker-compose.yml):**
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` / `JWT_REFRESH_SECRET` - Admin auth tokens
- `CUSTOMER_JWT_SECRET` / `CUSTOMER_JWT_REFRESH_SECRET` - Storefront auth tokens
- `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET` - Object storage
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` - Google OAuth (optional)
- `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET`, `FACEBOOK_CALLBACK_URL` - Facebook OAuth (optional)
- `INSTAGRAM_CLIENT_ID`, `INSTAGRAM_CLIENT_SECRET`, `INSTAGRAM_CALLBACK_URL` - Instagram OAuth (optional)
- `ROUTER_INTERNAL_SECRET` - Internal secret for router cache invalidation
- `PORTAL_HOSTNAME` - Admin portal domain
- `CORS_ORIGIN` / `FRONTEND_URL` - CORS configuration
- `BACKEND_INTERNAL_URL` - Portal/storefront to backend internal URL

**Build:**
- `tsconfig.base.json` - Root TypeScript config (strict, ES2022, nodenext)
- `nx.json` - Nx workspace config with plugin-based target inference
- `webpack.config.js` - Backend build (in `apps/backend/`)
- PostCSS config with `postcss-preset-mantine` and `postcss-simple-vars`

## Platform Requirements

**Development:**
- Node.js 22
- npm 11.8+
- PostgreSQL 16 (via Docker or local)
- Redis 7 (via Docker or local)
- MinIO (via Docker or local)

**Production:**
- Docker Compose stack with Caddy reverse proxy
- Caddy handles TLS (on-demand certificates) on ports 80/443
- PostgreSQL 16 Alpine
- Redis 7 Alpine (AOF persistence)
- MinIO (latest)

---

*Stack analysis: 2026-03-09*
