# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Helix is a fullstack authentication system built as an Nx monorepo. It features JWT auth with refresh token rotation, multi-device session management, device fingerprinting, login history auditing, 2FA support, and i18n (English/Turkish).

## Commands

All tasks must be run through Nx. Package manager is npm.

```bash
# Install dependencies
npm install

# Build
npx nx build @org/backend
npx nx build @org/web
npx nx run-many -t build              # build all

# Serve (development)
npx nx serve @org/backend             # NestJS on :3001
npx nx dev @org/web                   # Next.js on :3000

# Test
npx nx test @org/backend              # backend unit tests
npx nx test <project>                 # single project
npx nx run-many -t test               # all tests
npx nx test @org/backend -- --testPathPattern=auth  # single test file pattern

# E2E
npx nx e2e @org/backend-e2e

# Lint & Typecheck
npx nx lint <project>
npx nx typecheck <project>
npx nx run-many -t lint typecheck     # all projects

# Format
npx nx format:check
npx nx format:write

# Prisma (run from packages/prisma)
npx prisma generate                # uses prisma.config.ts → prisma/schema/ folder
npx prisma migrate dev             # multi-file schema in prisma/schema/
```

## Architecture

### Workspace Structure

- **`apps/backend`** — NestJS 11 API server (port 3001). Webpack-bundled. Uses Passport for auth (JWT, local, custom strategies), nestjs-i18n, nestjs-zod, Argon2 password hashing, Swagger docs.
- **`apps/web`** — Next.js 16 frontend (port 3000, App Router). Uses React Query for server state, Zustand for client state, next-intl for i18n, Axios for HTTP. Proxies `/api/*` requests to the backend via Next.js rewrites.
- **`apps/backend-e2e`** — Jest-based E2E tests for the backend. Has custom global setup/teardown.
- **`packages/prisma`** — Prisma 7 client and schema (PostgreSQL). Multi-file schema in `prisma/schema/` (base, enums, user, session, token, audit). Generated client output: `generated/prisma`. Three export paths: `.` (default), `./client`, `./browser`.
- **`packages/schemas`** — Zod validation schemas shared between frontend and backend. Subpath exports: `@org/schemas/*`.
- **`packages/types`** — Shared TypeScript type definitions.
- **`packages/constants`** — Shared constants.
- **`packages/i18n`** — i18n locale files (en, tr) with `common.json` and `validation.json` per locale.

### Key Patterns

- **Package scope**: `@org/` (e.g., `@org/backend`, `@org/prisma`, `@org/schemas`)
- **Custom condition**: `@org/source` in tsconfig and package.json exports enables direct TypeScript source imports during development
- **Module system**: All packages use ES modules (`"type": "module"`) with `nodenext` module resolution
- **Backend auth flow**: JWT access + refresh tokens with token family tracking for rotation anomaly detection. RefreshToken model has a self-referential `TokenChain` relation.
- **Backend i18n**: nestjs-i18n with locale files copied from `@org/i18n` as webpack assets. Custom exception filters (`HttpExceptionI18nFilter`, `ZodValidationI18nFilter`) for translated error responses.
- **Frontend i18n**: next-intl with request handler at `apps/web/core/i18n/request.ts`. The `@org/i18n` package is transpiled by Next.js.
- **Test targets** depend on `^build` (dependencies must build before tests run)

### Environment Variables

Backend (`apps/backend/.env`): `DATABASE_URL`, `NODE_ENV`, `CORS_ORIGIN`, `JWT_SECRET`, `JWT_REFRESH_SECRET`

Web (`apps/web/.env`): `JWT_SECRET`, `BACKEND_INTERNAL_URL`

### CI

GitHub Actions runs on push to main / PRs: `format:check`, then `lint`, `test`, `build`, `typecheck`, `e2e-ci` via `nx run-many`. Uses Nx Cloud for distributed caching and task execution.

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

## General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- You have access to the Nx MCP server and its tools, use them to help the user
- When answering questions about the repository, use the `nx_workspace` tool first to gain an understanding of the workspace architecture where applicable.
- When working in individual projects, use the `nx_project_details` mcp tool to analyze and understand the specific project structure and dependencies
- For questions around nx configuration, best practices or if you're unsure, use the `nx_docs` tool to get relevant, up-to-date docs. Always use this instead of assuming things about nx configuration
- If the user needs help with an Nx configuration or project graph error, use the `nx_workspace` tool to get any errors
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.

<!-- nx configuration end-->
