# External Integrations

**Analysis Date:** 2026-03-09

## APIs & External Services

**OAuth Providers (all optional, conditionally loaded):**
- Google OAuth 2.0 - Admin social login
  - SDK: `passport-google-oauth20`
  - Strategy: `apps/backend/src/app/admin/auth/strategies/google.strategy.ts`
  - Auth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
  - Loaded only when `GOOGLE_CLIENT_ID` is set

- Facebook OAuth - Admin social login
  - SDK: `passport-facebook`
  - Strategy: `apps/backend/src/app/admin/auth/strategies/facebook.strategy.ts`
  - Auth: `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET`, `FACEBOOK_CALLBACK_URL`
  - Loaded only when `FACEBOOK_CLIENT_ID` is set

- Instagram OAuth - Admin social login
  - SDK: `passport-custom` (custom strategy wrapping Instagram API)
  - Strategy: `apps/backend/src/app/admin/auth/strategies/instagram.strategy.ts`
  - Auth: `INSTAGRAM_CLIENT_ID`, `INSTAGRAM_CLIENT_SECRET`, `INSTAGRAM_CALLBACK_URL`
  - Loaded only when `INSTAGRAM_CLIENT_ID` is set

**Nx Cloud:**
- CI task distribution
  - Used in `.github/workflows/ci.yml` via `npx nx start-ci-run --distribute-on="3 linux-medium-js"`

## Data Storage

**Database:**
- PostgreSQL 16
  - Connection: `DATABASE_URL` env var
  - Client: Prisma Client 7.4 with `@prisma/adapter-pg` (native pg driver adapter)
  - Schema: Multi-file Prisma schema in `packages/prisma/prisma/schema/*.prisma` (26 schema files)
  - Schema files: `base.prisma` (generator + datasource), `user.prisma`, `product.prisma`, `variant.prisma`, `category.prisma`, `brand.prisma`, `customer.prisma`, `customer-group.prisma`, `organization.prisma`, `store.prisma`, `domain.prisma`, `inventory.prisma`, `warehouse.prisma`, `pricing.prisma`, `rule.prisma`, `evaluation-job.prisma`, `taxonomy.prisma`, `tag.prisma`, `uom.prisma`, `currency.prisma`, `geolocation.prisma`, `image.prisma`, `session.prisma`, `token.prisma`, `audit.prisma`, `enums.prisma`
  - Generated client output: `packages/prisma/generated/prisma`
  - PrismaService: `apps/backend/src/app/prisma/prisma.service.ts` (global module)
  - Seeds: `packages/prisma/src/seeds/` and `packages/prisma/src/new-seeds/`

**Object Storage:**
- MinIO (S3-compatible)
  - Client: `nestjs-minio` (NestMinioModule)
  - Config: `apps/backend/src/app/upload/upload.module.ts`
  - Services: `apps/backend/src/app/upload/minio-storage.service.ts`, `apps/backend/src/app/upload/upload.service.ts`, `apps/backend/src/app/upload/image-processor.service.ts`
  - Auth: `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_USE_SSL`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`
  - Bucket: `MINIO_BUCKET` (default: `helix`)
  - Docker volume: `miniodata`

**Caching / Pub-Sub:**
- Redis 7
  - Client: `ioredis` (custom provider)
  - Module: `apps/backend/src/app/redis/redis.module.ts` (Global module)
  - Injection token: `REDIS_CLIENT` from `apps/backend/src/app/redis/redis.constants.ts`
  - Auth: `REDIS_URL` env var
  - Also used by: storefront-router (domain resolution caching), BullMQ (job queue backing)
  - Docker volume: `redisdata` (AOF persistence)

## Job Queue

**BullMQ:**
- Purpose: Background job processing (customer group evaluation)
- Module: `apps/backend/src/app/admin/evaluation/evaluation.module.ts`
- Processor: `apps/backend/src/app/admin/evaluation/evaluation.processor.ts`
- Scheduler: `apps/backend/src/app/admin/evaluation/evaluation.scheduler.ts`
- Queue name: `EVALUATION_QUEUE` (from `apps/backend/src/app/admin/evaluation/evaluation.service.ts`)
- Backed by: Redis (parsed from `REDIS_URL`)
- Job options: 3 attempts, exponential backoff (5s base), keeps last 1000 completed / 5000 failed

## Authentication & Identity

**Admin Auth:**
- Custom JWT-based authentication (no external auth provider)
- Module: `apps/backend/src/app/admin/auth/auth.module.ts`
- Strategies:
  - Local (email/password): `apps/backend/src/app/admin/auth/strategies/local.strategy.ts`
  - JWT access token: `apps/backend/src/app/admin/auth/strategies/jwt.strategy.ts`
  - JWT refresh token: `apps/backend/src/app/admin/auth/strategies/jwt-refresh.strategy.ts`
  - Google/Facebook/Instagram OAuth (optional, see above)
- Password hashing: `@node-rs/argon2`
- Token delivery: HTTP-only cookies (cookie name from `@org/constants/auth-constants`)
- Global guard: `JwtAuthGuard` applied via `APP_GUARD` (all admin routes protected by default)
- Services: `AuthService`, `TokenService`, `SessionService`, `DeviceService`
- Auth: `JWT_SECRET`, `JWT_REFRESH_SECRET`

**Storefront (Customer) Auth:**
- Separate JWT auth for storefront customers
- Module: `apps/backend/src/app/storefront/auth/storefront-auth.module.ts`
- Strategies:
  - Customer local: `apps/backend/src/app/storefront/auth/strategies/customer-local.strategy.ts`
  - Customer JWT: `apps/backend/src/app/storefront/auth/strategies/customer-jwt.strategy.ts`
  - Customer JWT refresh: `apps/backend/src/app/storefront/auth/strategies/customer-jwt-refresh.strategy.ts`
- Guards:
  - `apps/backend/src/app/storefront/auth/guards/customer-jwt-auth.guard.ts`
  - `apps/backend/src/app/storefront/auth/guards/customer-jwt-refresh.guard.ts`
  - `apps/backend/src/app/storefront/auth/guards/store-scope.guard.ts` (scopes requests to specific store)
- Auth: `CUSTOMER_JWT_SECRET`, `CUSTOMER_JWT_REFRESH_SECRET`

**Portal (Frontend) Auth:**
- JWT verification on frontend using `jose` library
- Cookie-based token forwarding to backend via `BACKEND_INTERNAL_URL`

## Internationalization (i18n)

**Backend:**
- Framework: `nestjs-i18n` 10
- Module: `apps/backend/src/app/i18n/i18n.module.ts`
- Locale resolution: Cookie (`LOCALE`), query param (`lang`), `Accept-Language` header, `x-lang` header
- Fallback language: `en`
- Filters: `HttpExceptionI18nFilter`, `ZodValidationI18nFilter` in `apps/backend/src/app/app.module.ts`

**Frontend:**
- Framework: `next-intl` 4
- Locales: `en`, `tr`
- Namespace files per app: `packages/i18n/src/locales/{locale}/{backend,portal,b2c,b2b,validation}.json`

## Monitoring & Observability

**Error Tracking:**
- None detected (no Sentry, Datadog, etc.)

**Logs:**
- Backend: NestJS built-in `Logger`
- Storefront Router: Fastify built-in `pino` logger (configurable via `LOG_LEVEL` env var)

**API Documentation:**
- Swagger/OpenAPI (development only)
  - Config: `apps/backend/src/main.ts`
  - URL: `http://localhost:3003/docs`
  - Uses `nestjs-zod` `cleanupOpenApiDoc()` for Zod schema integration
  - Cookie auth via `ACCESS_TOKEN_COOKIE_NAME`

## CI/CD & Deployment

**CI Pipeline:**
- GitHub Actions (`.github/workflows/ci.yml`)
- Triggers: push to `main`, pull requests
- Steps: `npm ci` -> format check -> lint, test, build, typecheck, e2e (parallelized via Nx Cloud)
- Nx Cloud task distribution: 3 linux-medium-js agents

**Hosting:**
- Docker Compose self-hosted stack
- Docker Compose file: `docker-compose.yml`
- Dockerfiles: `docker/backend.Dockerfile`, `docker/portal.Dockerfile`, `docker/storefront-router.Dockerfile`, `docker/b2c-storefront.Dockerfile`, `docker/seed.Dockerfile`, `docker/caddy.Dockerfile`
- Reverse proxy: Caddy with on-demand TLS (automatic HTTPS certificates)
- Profiles: default (portal + router + backend), `b2c`, `b2b`, `full`

## Storefront Domain Routing

**Storefront Router** (`apps/storefront-router/`):
- Fastify-based reverse proxy that routes incoming requests to B2C or B2B storefronts based on domain
- Resolves domain -> store mapping via backend API (`/.well-known/helix-routing`)
- Caches domain resolutions (with invalidation endpoint)
- Injects headers: `x-store-id`, `x-store-slug`, `x-store-name`, `x-business-model`
- Health checking of upstream storefronts
- Plugin: `apps/storefront-router/src/plugins/router-plugin.ts`
- Cache: `apps/storefront-router/src/plugins/resolve-cache.ts`
- Health: `apps/storefront-router/src/plugins/upstream-health.ts`
- Internal cache invalidation: `POST /cache/invalidate` (secured via `ROUTER_INTERNAL_SECRET` with timing-safe comparison)

## Environment Configuration

**Required env vars:**
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Admin JWT signing secret
- `JWT_REFRESH_SECRET` - Admin refresh token secret
- `CUSTOMER_JWT_SECRET` - Customer JWT signing secret
- `CUSTOMER_JWT_REFRESH_SECRET` - Customer refresh token secret
- `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY` - MinIO connection
- `MINIO_BUCKET` - MinIO bucket name (default: `helix`)
- `ROUTER_INTERNAL_SECRET` - Internal router cache invalidation secret
- `PORTAL_HOSTNAME` - Admin portal hostname (for Caddy routing)
- `POSTGRES_PASSWORD` - PostgreSQL password (Docker Compose)
- `TLS_ASK_SECRET` - Caddy on-demand TLS verification secret

**Optional env vars:**
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` - Google OAuth
- `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET`, `FACEBOOK_CALLBACK_URL` - Facebook OAuth
- `INSTAGRAM_CLIENT_ID`, `INSTAGRAM_CLIENT_SECRET`, `INSTAGRAM_CALLBACK_URL` - Instagram OAuth
- `CORS_ORIGIN`, `FRONTEND_URL` - CORS settings
- `BACKEND_INTERNAL_URL` - Portal/storefront internal backend URL (default: `http://backend:3001`)
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (per app)
- `LOG_LEVEL` - Storefront router log level

**Secrets location:**
- `.env` file at project root (gitignored)
- Docker Compose environment variable interpolation from `.env`

## Webhooks & Callbacks

**Incoming:**
- `POST /cache/invalidate` - Storefront router cache invalidation (internal, secret-protected)
- `GET /.well-known/helix-routing` - Domain resolution endpoint (used by storefront router)
- OAuth callback URLs (Google, Facebook, Instagram) - configured per provider

**Outgoing:**
- Backend -> Storefront Router: cache invalidation calls via `ROUTER_URL` + `ROUTER_INTERNAL_SECRET`

## Data Export

**Export Service:**
- Module: `apps/backend/src/app/export/export.module.ts`
- Service: `apps/backend/src/app/export/export.service.ts`
- Formats: Excel (`exceljs`), CSV (`@fast-csv/format`)

---

*Integration audit: 2026-03-09*
