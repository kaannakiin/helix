# External Integrations

**Analysis Date:** 2026-02-27

## APIs & External Services

**OAuth 2.0 Providers:**
- **Google** - User authentication via OAuth 2.0
  - SDK/Client: `passport-google-oauth20` (v2.0.0)
  - Strategy: `GoogleStrategy` at `apps/backend/src/app/auth/strategies/google.strategy.ts`
  - Auth env vars: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
  - Scope configured via Passport strategy

- **Facebook** - User authentication via OAuth 2.0
  - SDK/Client: `passport-facebook` (v3.0.0)
  - Strategy: `FacebookStrategy` at `apps/backend/src/app/auth/strategies/facebook.strategy.ts`
  - Auth env vars: `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET`, `FACEBOOK_CALLBACK_URL`
  - Scope configured via Passport strategy

- **Instagram** - User authentication via OAuth 2.0 (uses Facebook Graph API)
  - SDK/Client: `passport-facebook` (v3.0.0) - Instagram uses Facebook Graph API
  - Strategy: `InstagramStrategy` at `apps/backend/src/app/auth/strategies/instagram.strategy.ts`
  - Auth env vars: `INSTAGRAM_CLIENT_ID`, `INSTAGRAM_CLIENT_SECRET`, `INSTAGRAM_CALLBACK_URL`
  - Provider mapping: 'INSTAGRAM' stored in user account metadata

## Data Storage

**Databases:**
- **PostgreSQL 12+**
  - Connection: `DATABASE_URL` environment variable
  - Client: Prisma 7.4.1 ORM with `@prisma/client`
  - Adapter: `@prisma/adapter-pg` for native PostgreSQL support
  - Native driver: `pg` (v8.18.0) for direct connections
  - Schema: Multi-file composition in `packages/prisma/prisma/schema/`:
    - `base.prisma` - Provider and datasource configuration
    - `enums.prisma` - Global enums (UserRole, Locale, LoginMethod, etc.)
    - `user.prisma` - User model with profile and settings
    - `session.prisma` - Session management for multi-device support
    - `token.prisma` - Refresh tokens with TokenChain for rotation tracking
    - `audit.prisma` - Login history and audit trails
    - `image.prisma` - Image metadata and associations
    - `brand.prisma` - Brand master data
    - `category.prisma` - Product category hierarchy
    - `product.prisma` - Product catalog with translations
    - `variant.prisma` - Product variants
    - `tag.prisma` - Hierarchical tags with tag groups
    - `rule.prisma` - Rule engine for dynamic configurations
    - `inventory.prisma` - Stock and warehouse management
    - `geolocation.prisma` - Geographic data for location services
    - `uom.prisma` - Units of measurement
    - `warehouse.prisma` - Warehouse and location data
    - `currency.prisma` - Currency master data
    - `pricing.prisma` - Dynamic pricing system
    - `taxonomy.prisma` - Taxonomy support

**File Storage:**
- **MinIO** (S3-compatible object storage)
  - Client: `minio` (v8.0.6)
  - NestJS integration: `nestjs-minio` (v2.6.3)
  - Service: `MinioStorageService` at `apps/backend/src/app/upload/minio-storage.service.ts`
  - Configuration:
    - `MINIO_ENDPOINT` - MinIO server hostname
    - `MINIO_PORT` - MinIO port (default: 9000)
    - `MINIO_USE_SSL` - SSL/TLS flag (default: false)
    - `MINIO_ACCESS_KEY` - Access key credential
    - `MINIO_SECRET_KEY` - Secret key credential
    - `MINIO_BUCKET` - Bucket name for uploads
  - Operations: Upload, delete file, delete folder (recursive), public URL generation
  - Graceful degradation: Connection errors logged as warnings; upload features disabled if MinIO unavailable

**Caching:**
- Not detected - No Redis or caching layer configured

## Authentication & Identity

**Auth Provider:**
- Custom - JWT-based authentication with multiple strategies

**Implementation Approach:**

1. **JWT Tokens:**
   - Access token + Refresh token pattern
   - Access tokens: Short-lived, contains user claims
   - Refresh tokens: Long-lived, stored in Prisma with TokenChain for anomaly detection
   - Signing: `@nestjs/jwt` with `JWT_SECRET` for access and `JWT_REFRESH_SECRET` for refresh
   - Frontend client: `jose` (v6.1.3) for token verification

2. **Authentication Strategies:**
   - `JwtStrategy` - Validates incoming Authorization Bearer tokens
   - `JwtRefreshStrategy` - Validates refresh token from cookies
   - `LocalStrategy` - Username/email + password via `passport-local`
   - `GoogleStrategy` - OAuth 2.0 Google login
   - `FacebookStrategy` - OAuth 2.0 Facebook login
   - `InstagramStrategy` - OAuth 2.0 Instagram login (Facebook Graph API)

3. **Session Management:**
   - Multi-device sessions tracked via `Session` model in Prisma
   - Device fingerprinting via `ua-parser-js` (v2.0.9)
   - Real IP extraction via `nestjs-real-ip` (v3.0.1)
   - Login history audit in `AuditLog` model

4. **Middleware & Guards:**
   - `JwtAuthGuard` - Enforces JWT validation globally (can be skipped with `@Public()`)
   - `RolesGuard` - Role-based access control via `@Roles()` decorator
   - Passport strategies integrated in `AuthModule` at `apps/backend/src/app/auth/auth.module.ts`

5. **Password Hashing:**
   - Argon2 via `@node-rs/argon2` (v2.0.2) for secure password storage
   - Used in: `AuthService` password operations and seed data generation

6. **Token Cookies:**
   - Cookie name: `ACCESS_TOKEN_COOKIE_NAME` from `@org/constants`
   - Cookie parser: `cookie-parser` (v1.4.7) middleware
   - Locale cookie: `LOCALE` cookie for i18n fallback
   - Frontend interceptor: Auto-refresh on 401 via `apiClient` in `apps/web/core/lib/api/api-client.ts`

## Monitoring & Observability

**Error Tracking:**
- Not detected - No third-party error tracking service (Sentry, Rollbar, etc.)

**Logs:**
- Console-based: NestJS Logger utility
- i18n integration: Custom exception filters translate errors before logging
- Backend: `HttpExceptionI18nFilter` at `apps/backend/src/app/i18n/http-exception-i18n.filter.ts`
- Backend: `ZodValidationI18nFilter` at `apps/backend/src/app/i18n/zod-validation-i18n.filter.ts`
- MinIO startup: Graceful connection timeout with 5-second limit and warning message

## CI/CD & Deployment

**Hosting:**
- Not detected - No specific platform (AWS, Vercel, etc.) enforced in config

**CI Pipeline:**
- GitHub Actions
  - Workflows in `.github/workflows/`
  - Tasks: `format:check`, `lint`, `test`, `build`, `typecheck`, `e2e-ci`
  - Execution: `nx run-many` with distributed caching via Nx Cloud
  - Trigger: Push to main branch or pull request

**Deploy Scripts:**
- Not detected - No deployment configuration in codebase

## Environment Configuration

**Required env vars:**

Backend (critical):
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret (min recommended: 32+ chars)
- `MINIO_BUCKET` - MinIO bucket name (required for uploads)

Backend (conditional):
- `JWT_REFRESH_SECRET` - Refresh token secret (required for token refresh)
- `CORS_ORIGIN` - Required in production (allowed origin URL)
- OAuth vars (required if social auth enabled):
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
  - `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET`, `FACEBOOK_CALLBACK_URL`
  - `INSTAGRAM_CLIENT_ID`, `INSTAGRAM_CLIENT_SECRET`, `INSTAGRAM_CALLBACK_URL`
- MinIO vars (required if using MinIO):
  - `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_USE_SSL`
  - `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`

Frontend (critical):
- `JWT_SECRET` - Must match backend value for token verification
- `BACKEND_INTERNAL_URL` - Backend URL for server-side requests (dev: `http://localhost:3001`)

**Secrets location:**
- `.env` files at app roots (`.gitignore`d):
  - `apps/backend/.env`
  - `apps/web/.env`
- Never committed to git
- Loaded via `ConfigModule.forRoot({ isGlobal: true })` in NestJS

## Webhooks & Callbacks

**Incoming:**
- Not detected - No webhook endpoints for external services

**Outgoing:**
- **OAuth Callbacks:**
  - Google: POST to `GOOGLE_CALLBACK_URL` (Passport handles via Express)
  - Facebook: POST to `FACEBOOK_CALLBACK_URL` (Passport handles via Express)
  - Instagram: POST to `INSTAGRAM_CALLBACK_URL` (Passport handles via Express)
  - Endpoints: `apps/backend/src/app/auth/auth.controller.ts` routes OAuth responses

## Rate Limiting & Throttling

**Not detected** - No rate limiting middleware configured

## CORS Configuration

**Backend CORS:**
- Development: `origin: true` (accept all)
- Production: `origin: config.getOrThrow<string>('CORS_ORIGIN')`
- Credentials: `true` (allow cookies in CORS requests)
- Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
- Headers: Content-Type, Authorization, Accept-Language, x-lang

**Frontend Proxy:**
- Next.js rewrites `/api/*` requests to backend via `BACKEND_INTERNAL_URL`
- Configured in `apps/web/next.config.js`

## Security Headers

**Helmet Middleware:**
- Backend: `helmet` (v8.1.0) provides HTTP security headers
- CSP: Disabled in development, enabled in production (configurable)
- Protects against: Clickjacking, MIME sniffing, XSS, etc.

---

*Integration audit: 2026-02-27*
