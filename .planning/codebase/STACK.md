# Technology Stack

**Analysis Date:** 2026-02-27

## Languages

**Primary:**
- TypeScript 5.9.2 - Used across all packages, apps, and configuration files with strict mode enabled
- JavaScript (JSX/TSX) - React components in frontend, Node.js scripts

**Secondary:**
- PostgreSQL SQL - Database schema and migrations
- JSON - Prisma schema composition via multi-file structure

## Runtime

**Environment:**
- Node.js 25.2.1 - Verified local version (npm managed)

**Package Manager:**
- npm 11.8.0 - Defined in root package.json `packageManager` field
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- NestJS 11.0.0 - Backend API server (`apps/backend`, port 3001), Webpack-bundled via webpack CLI
- Next.js 16.0.1 - Frontend application (`apps/web`, port 3000), App Router with Turbopack dev compilation
- Prisma 7.4.1 - ORM with PostgreSQL adapter (`packages/prisma`, multi-file schema in `prisma/schema/`)

**UI/Styling:**
- Mantine 8.3.15 - React UI component library with date picker, dropzone, notifications, spotlight modules
- Tailwind CSS 4.2.0 - Utility-first CSS framework with PostCSS integration
- React 19.0.0 - UI rendering library

**State Management:**
- React Query 5.90.21 - Server state management with `@tanstack/react-query`
- React Query Devtools 5.91.3 - Development debugging for server state
- Zustand 5.0.11 - Client state management with immer middleware
- Immer 11.1.4 - Immutable state updates

**Forms & Validation:**
- React Hook Form 7.71.1 - Form state management
- Zod 4.3.6 - Schema validation (shared across frontend and backend via `@org/schemas`)
- nestjs-zod 5.1.1 - Zod integration for NestJS DTOs with auto-validation pipes

**i18n:**
- next-intl 4.8.3 - Frontend i18n with request handler at `apps/web/core/i18n/request.ts`
- nestjs-i18n 10.4.9 - Backend i18n with locale file resolution and custom exception filters
- @org/i18n package - Shared locale files (en, tr) with common.json and validation.json per locale

**Build/Dev Tools:**
- Webpack 5.105.2 - Backend bundler (configured in `apps/backend/webpack.config.js`)
- Nx 22.5.0 - Monorepo tool with plugins: `@nx/webpack`, `@nx/next`, `@nx/jest`, `@nx/nest`, `@nx/js`, `@nx/eslint`, `@nx/node`, `@nx/web`
- SWC 1.15.8 - Fast TypeScript compiler (`@swc/core`, `@swc/cli`)
- tsx 1.11.1 - TypeScript executor for scripts
- PostCSS 8.5.6 - CSS transformation with tailwindcss preset and postcss-simple-vars plugin

**Testing:**
- Jest 30.0.2 - Unit testing framework
- @nx/jest 22.5.0 - Nx Jest plugin
- ts-jest 29.4.0 - TypeScript support for Jest
- @swc/jest ~0.2.38 - SWC Jest preset for faster compilation
- @types/jest 30.0.0 - Jest type definitions

**Linting & Formatting:**
- ESLint 9.8.0 - Code linting with `@nx/eslint`, `@eslint/js`, `typescript-eslint`
- Prettier 2.6.2 - Code formatting (single quotes configured in `.prettierrc`)
- eslint-config-prettier 10.0.0 - Prettier integration with ESLint

## Key Dependencies

**Critical:**
- passport 0.7.0 - Authentication middleware framework
- passport-jwt 4.0.1 - JWT strategy
- passport-local 1.0.0 - Local username/password strategy
- passport-google-oauth20 2.0.0 - Google OAuth 2.0 strategy
- passport-facebook 3.0.0 - Facebook OAuth strategy
- passport-custom 1.1.1 - Custom authentication strategy for OAuth wrapper
- @nestjs/passport 11.0.5 - Passport integration for NestJS
- @nestjs/jwt 11.0.2 - JWT handling in NestJS
- jose 6.1.3 - JWT operations (frontend token handling)

**Security:**
- @node-rs/argon2 2.0.2 - Argon2 password hashing (used in both backend and prisma seed)
- helmet 8.1.0 - HTTP security headers middleware
- cookie-parser 1.4.7 - Cookie parsing middleware
- nestjs-real-ip 3.0.1 - Real IP extraction for geolocation

**Database:**
- @prisma/client 7.4.1 - Prisma ORM client
- @prisma/adapter-pg 7.4.0/7.4.1 - PostgreSQL adapter for Prisma
- pg 8.18.0 - Native PostgreSQL driver
- dotenv 17.3.1 - Environment variable loading

**File Storage:**
- minio 8.0.6 - MinIO S3-compatible client
- nestjs-minio 2.6.3 - NestJS integration for MinIO
- MINIO_ENDPOINT, MINIO_PORT, MINIO_USE_SSL, MINIO_ACCESS_KEY, MINIO_SECRET_KEY - Environment configured

**Data/Export:**
- exceljs 4.4.0 - Excel file generation for admin exports
- @fast-csv/format 5.0.5 - CSV formatting for data export

**HTTP/API:**
- axios 1.13.5 - Frontend HTTP client with auto-refresh interceptor
- express 5.2.1 - Express server (used by NestJS)
- @nestjs/platform-express 11.0.0 - Express integration for NestJS

**Documentation:**
- @nestjs/swagger 11.2.6 - Swagger API documentation generator
- swagger-ui-dist 5.31.1 - Swagger UI frontend

**Utilities:**
- ua-parser-js 2.0.9 - User-agent parsing for device fingerprinting
- dayjs 1.11.19 - Date/time utility library
- lucide-react 0.475.0 - Icon library
- clsx 2.1.1 - Conditional className builder
- tslib 2.3.0 - TypeScript runtime support library
- reflect-metadata 0.1.13 - Metadata reflection for decorators
- rxjs 7.8.0 - Reactive programming library

**UI Components:**
- ag-grid-community 35.1.0 - DataTable grid component
- ag-grid-react 35.1.0 - React bindings for ag-grid
- @dnd-kit/core 6.3.1 - Drag-and-drop primitives
- @dnd-kit/sortable 10.0.0 - Sortable list implementation
- @dnd-kit/utilities 3.2.2 - Drag-and-drop utilities
- @mantine/dates 8.3.15 - Mantine date picker
- @mantine/dropzone 8.3.15 - Mantine file upload dropzone
- @mantine/hooks 8.3.15 - Mantine React hooks
- @mantine/notifications 8.3.15 - Toast notification component
- @mantine/spotlight 8.3.15 - Command palette component
- @hookform/resolvers 5.2.2 - React Hook Form resolvers for validation

**Rich Text Editor:**
- @tiptap/react 3.20.0 - React integration for Tiptap
- @tiptap/starter-kit 3.20.0 - Tiptap core extensions
- @tiptap/extension-link 3.20.0 - Link support
- @tiptap/extension-underline 3.20.0 - Underline support
- @tiptap/extension-placeholder 3.20.0 - Placeholder text support

**Development Utilities:**
- set-cookie-parser 3.0.1 - Parse Set-Cookie headers (devDependency for frontend)

## Configuration

**Environment:**

Backend (`apps/backend/.env` - NEVER committed):
- `DATABASE_URL` - PostgreSQL connection string
- `NODE_ENV` - environment (development/production)
- `CORS_ORIGIN` - CORS origin URL (production only)
- `JWT_SECRET` - JWT signing secret
- `JWT_REFRESH_SECRET` - Refresh token signing secret
- `PORT` - Server port (defaults to 3001)
- `MINIO_ENDPOINT` - MinIO server endpoint (defaults to 'localhost')
- `MINIO_PORT` - MinIO port (defaults to 9000)
- `MINIO_USE_SSL` - MinIO SSL flag (defaults to 'false')
- `MINIO_ACCESS_KEY` - MinIO access key (defaults to 'minioadmin')
- `MINIO_SECRET_KEY` - MinIO secret key (defaults to 'minioadmin')
- `MINIO_BUCKET` - MinIO bucket name
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth secret
- `GOOGLE_CALLBACK_URL` - Google OAuth callback URL
- `FACEBOOK_CLIENT_ID` - Facebook OAuth client ID
- `FACEBOOK_CLIENT_SECRET` - Facebook OAuth secret
- `FACEBOOK_CALLBACK_URL` - Facebook OAuth callback URL
- `INSTAGRAM_CLIENT_ID` - Instagram OAuth client ID
- `INSTAGRAM_CLIENT_SECRET` - Instagram OAuth secret
- `INSTAGRAM_CALLBACK_URL` - Instagram OAuth callback URL

Web (`apps/web/.env` - NEVER committed):
- `JWT_SECRET` - Matches backend JWT_SECRET for token verification
- `BACKEND_INTERNAL_URL` - Internal backend URL for server-side requests (defaults to `http://localhost:3001`)

**Build:**

Backend webpack config: `apps/backend/webpack.config.js`
- Nx webpack app plugin for Node target
- Custom condition: `@org/source` for monorepo TypeScript imports
- i18n assets copied from `@org/i18n` during build
- Source maps enabled in non-production
- Optimizations disabled for better stack traces

Frontend Next.js config: `apps/web/next.config.js`
- Nx Next plugin integration
- next-intl plugin for i18n
- Transpile packages: `@org/i18n`, `@org/ui`, `@org/constants`
- Custom condition: `@org/source` for monorepo imports
- API rewrites: `/api/*` → `${BACKEND_INTERNAL_URL}/api/*`

Prisma config: `packages/prisma/prisma.config.ts`
- Multi-file schema in `prisma/schema/` directory
- Migrations stored in `prisma/migrations/`
- DATABASE_URL from environment

**TypeScript:**

tsconfig.base.json:
- Target: ES2022
- Module: nodenext (ES modules)
- Module resolution: nodenext
- Strict mode enabled
- Custom condition: `@org/source` for monorepo source imports
- Skip lib check enabled
- Source maps enabled

## Platform Requirements

**Development:**
- Node.js 25.2.1 (or compatible LTS)
- npm 11.8.0
- PostgreSQL 12+ (for DATABASE_URL)
- MinIO (for file upload features, optional)

**Production:**
- Node.js 20+ (tested on 25.2.1)
- PostgreSQL 12+
- MinIO or S3-compatible storage (for image uploads)
- CORS_ORIGIN must be configured
- All OAuth credentials (Google, Facebook, Instagram) required if social auth enabled
- Helmet security headers enforced

---

*Stack analysis: 2026-02-27*
