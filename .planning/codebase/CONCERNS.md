# Codebase Concerns

**Analysis Date:** 2026-03-09

## Tech Debt

**Missing Authorization / RBAC System:**
- Issue: The backend has authentication guards (JWT, OAuth) but no role-based or attribute-based access control. The TODO at `apps/backend-e2e/src/support/prisma.helper.ts:82` explicitly states "Re-implement with ABAC when available." All authenticated admin users have equal access to all resources.
- Files: `apps/backend/src/app/admin/auth/guards/`, `apps/backend-e2e/src/support/prisma.helper.ts`
- Impact: Any authenticated admin user can perform any operation (create, update, delete) on any resource. No permission granularity exists.
- Fix approach: Implement RBAC/ABAC guard system with role definitions, permission decorators, and a guard that checks user roles against required permissions per endpoint.

**No Multi-Tenancy Scoping on Data Queries:**
- Issue: There is no `organizationId`, `orgId`, or `tenantId` scoping on backend service queries. All data operations (CRUD) are unscoped, meaning any admin can access/modify all data across all organizations.
- Files: `apps/backend/src/app/admin/products/products.service.ts`, `apps/backend/src/app/admin/categories/categories.service.ts`, `apps/backend/src/app/admin/brands/brands.service.ts`, and all other admin services
- Impact: In a multi-tenant scenario, data leaks between tenants. Bulk operations (`deleteMany`, `updateMany`) are especially risky as they affect all matching records globally.
- Fix approach: Add organization-scoped Prisma middleware or a base service class that automatically injects tenant context into all queries.

**Oversized Page Components (God Components):**
- Issue: Multiple portal page components exceed 500-700+ lines, mixing form logic, data fetching, UI rendering, and state management in a single file.
- Files:
  - `apps/portal/app/(admin)/products/[id]/page.tsx` (793 lines)
  - `apps/portal/app/(admin)/stores/[id]/domains/connect/page.tsx` (751 lines)
  - `apps/portal/app/(admin)/products/variants/[id]/page.tsx` (720 lines)
  - `apps/portal/app/(admin)/definitions/evaluation-jobs/[id]/page.tsx` (598 lines)
  - `apps/portal/app/(admin)/customers/customer-groups/[id]/page.tsx` (559 lines)
  - `apps/portal/app/(admin)/products/[id]/components/VariantGroupDrawer.tsx` (595 lines)
- Impact: Hard to maintain, test, and review. High risk of regressions when modifying any part of these files.
- Fix approach: Extract form logic into custom hooks, split rendering into smaller sub-components, and move data-fetching concerns into dedicated hooks.

**Oversized Backend Services:**
- Issue: Several backend services exceed 500+ lines with complex transaction logic.
- Files:
  - `apps/backend/src/app/admin/products/products.service.ts` (765 lines)
  - `apps/backend/src/app/admin/tag-groups/tag-groups.service.ts` (573 lines)
  - `apps/backend/src/app/admin/categories/categories.service.ts` (545 lines)
  - `apps/backend/src/app/admin/auth/auth.service.ts` (529 lines)
- Impact: High cognitive load, difficult to unit test individual operations, risk of transaction bugs.
- Fix approach: Extract complex transaction logic into dedicated sub-services or use-case classes (e.g., `ProductSaveUseCase`).

**Duplicate Phone Input Component:**
- Issue: Two `phone-input` implementations exist -- one as a standalone file and one inside a directory.
- Files: `packages/ui/src/inputs/phone-input.tsx` (235 lines), `packages/ui/src/inputs/phone-input/phone-input.tsx` (235 lines)
- Impact: Confusion about which to import, potential drift between the two versions.
- Fix approach: Remove the standalone file `packages/ui/src/inputs/phone-input.tsx` and keep only the directory version `packages/ui/src/inputs/phone-input/`.

**Scattered `as any` Type Assertions:**
- Issue: 12+ instances of `as any` across the codebase, bypassing TypeScript type safety.
- Files:
  - `apps/backend/src/app/storefront/auth/strategies/customer-local.strategy.ts:23` -- `(req as any).__storeId`
  - `apps/portal/app/(admin)/products/tags/[id]/components/TagTreeTable.tsx:162,216` -- `(row as any).__isChild`
  - `apps/portal/app/(admin)/products/[id]/components/VariantOptionDrawer.tsx:74` -- `img.fileType as any`
  - `apps/portal/app/(admin)/products/[id]/components/BulkEditDrawer.tsx:59,66`
  - `apps/portal/app/(admin)/products/[id]/components/VariantEditDrawer.tsx:155`
  - `apps/portal/app/(admin)/products/[id]/components/VariantGroupDrawer.tsx:313`
- Impact: Runtime type errors that TypeScript cannot catch; code becomes fragile.
- Fix approach: Extend Express Request type for `__storeId`, create proper typed row interfaces for tree tables, and fix form value types to match schemas.

**Storefronts Are Empty Shells:**
- Issue: Both `apps/b2c-storefront` and `apps/b2b-storefront` contain only 4 source files each (layout, page, i18n request, index.d.ts). They are placeholder apps with no actual storefront functionality.
- Files: `apps/b2c-storefront/src/app/page.tsx`, `apps/b2b-storefront/app/page.tsx`
- Impact: The backend has storefront auth, store scoping, and product/store visibility logic, but there is no frontend to consume it. This is incomplete architecture.
- Fix approach: Implement storefront frontends or remove the storefront backend code until frontends are ready to avoid maintaining unused backend APIs.

## Security Considerations

**No Rate Limiting:**
- Risk: No rate limiting or throttling on any endpoints, including auth endpoints (login, register, password change).
- Files: `apps/backend/src/main.ts`, `apps/backend/src/app/app.module.ts`
- Current mitigation: None detected.
- Recommendations: Add `@nestjs/throttler` with strict limits on auth endpoints (login, register, refresh) and moderate limits on CRUD endpoints.

**MinIO Bucket Public Read Policy:**
- Risk: The MinIO storage service sets a blanket `s3:GetObject` policy with `Principal: *` on the entire bucket, making all uploaded files publicly readable.
- Files: `apps/backend/src/app/upload/minio-storage.service.ts:37-52`
- Current mitigation: None. Any file uploaded to the bucket is publicly accessible if the URL is known.
- Recommendations: Use pre-signed URLs for private files, or segment into public/private buckets. At minimum, ensure only product images (intended to be public) go to this bucket.

**MinIO Startup Failure Silently Ignored:**
- Risk: If MinIO is unavailable at startup, the service logs a warning but continues running. Upload operations will fail at runtime with unhelpful errors.
- Files: `apps/backend/src/app/upload/minio-storage.service.ts:17-29`
- Current mitigation: `console.warn` log message.
- Recommendations: Add a health check endpoint that reports MinIO connectivity status. Consider failing fast in production if MinIO is unavailable.

**No CSRF Protection:**
- Risk: Cookie-based authentication without CSRF protection. The backend uses `httpOnly` cookies for auth tokens.
- Files: `apps/backend/src/main.ts`
- Current mitigation: CORS is configured, but CORS alone does not prevent CSRF attacks with `credentials: true`.
- Recommendations: Implement CSRF tokens (e.g., `csurf` middleware) or switch to `SameSite=Strict` cookies.

**No Input Sanitization on Rich Text:**
- Risk: The portal uses a `RichTextEditor` component. If rich text HTML is stored and rendered without sanitization, XSS is possible.
- Files: `packages/ui/src/inputs/rich-text-editor/`, `apps/portal/app/(admin)/products/[id]/page.tsx`
- Current mitigation: Not investigated in depth.
- Recommendations: Sanitize HTML on the backend before storage using a library like `sanitize-html` or `DOMPurify`.

## Performance Bottlenecks

**No Pagination on Export Streams (Memory Pressure):**
- Problem: The export service streams data using batch iterators, but the batch size constants and back-pressure handling are not visible. Large exports could cause memory pressure.
- Files: `apps/backend/src/app/export/export.service.ts`
- Cause: Async iterator pattern with `void (async () => { ... })()` fire-and-forget could create unbounded memory usage if the writable stream backs up.
- Improvement path: Add back-pressure handling (check `stream.write()` return value and wait for `drain` event).

**Count Queries Use Raw SQL:**
- Problem: The `resolveCountFilters` function in the query builder constructs raw SQL count queries. This is likely for performance, but raw SQL is harder to maintain and potentially vulnerable to injection if not properly parameterized.
- Files: `apps/backend/src/core/utils/prisma-query-builder.ts`
- Cause: Prisma's `_count` on filtered relations is limited.
- Improvement path: Audit for proper parameterization; consider Prisma's `$queryRaw` with tagged template literals for safety.

## Fragile Areas

**Product Save Transaction:**
- Files: `apps/backend/src/app/admin/products/products.service.ts:248-550`
- Why fragile: The product save method is a single massive `$transaction` spanning ~300 lines that handles translations, images, variant groups, variants, categories, tags, stores, and SEO in one atomic operation. Any failure in any sub-step rolls back everything.
- Safe modification: Test each sub-operation in isolation before changing transaction logic. The E2E tests do not cover product CRUD.
- Test coverage: No unit or E2E tests for product creation/update.

**Host Routing / Domain Resolution:**
- Files: `apps/backend/src/app/admin/stores/host-routing.service.ts` (389 lines)
- Why fragile: Complex Redis caching with many fallback paths. 7 separate try/catch blocks with `logger.warn` on Redis failures. Multiple cache invalidation patterns that must stay in sync.
- Safe modification: This is one of the few well-tested areas (has both unit spec and E2E tests). Modify with tests.
- Test coverage: `apps/backend/src/app/admin/stores/host-routing.service.spec.ts`, `apps/backend-e2e/src/stores/domain-*.spec.ts`

**Tag Group Tree Operations:**
- Files: `apps/backend/src/app/admin/tag-groups/tag-groups.service.ts` (573 lines), `apps/portal/app/(admin)/products/tags/[id]/components/TagTreeTable.tsx` (362 lines)
- Why fragile: Tree data structures with parent-child relationships, using `as any` hacks for `__isChild` markers. Frontend uses untyped row properties.
- Safe modification: Create a proper typed interface for tree rows instead of ad-hoc `__isChild` property.
- Test coverage: No tests for tag group CRUD.

## Test Coverage Gaps

**Portal Frontend (0% test coverage):**
- What's not tested: The entire portal app (97 source files) has zero test files.
- Files: `apps/portal/`
- Risk: Any refactoring of form logic, data fetching hooks, or UI components has no safety net. The oversized page components (700+ lines) are especially risky to modify.
- Priority: High

**Backend Admin Services (near 0% unit test coverage):**
- What's not tested: Products, categories, brands, tag groups, variant groups, customer groups, evaluation, export, warehouses, organizations -- none have unit tests.
- Files: `apps/backend/src/app/admin/products/`, `apps/backend/src/app/admin/categories/`, `apps/backend/src/app/admin/brands/`, `apps/backend/src/app/admin/tag-groups/`, etc.
- Risk: Complex transaction logic in these services (e.g., product save spanning 300+ lines) is untested.
- Priority: High

**Existing Test Coverage (limited but present):**
- Backend unit tests: `apps/backend/src/app/admin/stores/host-routing.service.spec.ts`, `apps/backend/src/app/admin/stores/domain-utils.spec.ts`, `apps/backend/src/app/admin/auth/guards/jwt-auth.guard.spec.ts`, `apps/backend/src/app/storefront/auth/guards/store-scope.guard.spec.ts`, `apps/backend/src/app/app.service.spec.ts`
- E2E tests: `apps/backend-e2e/` covers auth flows (login, register, sessions, refresh, logout, devices, profile, password change) and store domain management (5 spec files).
- What's covered: Auth and domain routing are reasonably tested. Everything else is not.
- Priority: Medium (expand E2E coverage to product/category/brand CRUD)

**Shared Packages (near 0% test coverage):**
- What's not tested: `packages/ui/`, `packages/schemas/`, `packages/hooks/`, `packages/constants/`, `packages/types/` have no tests.
- Files: All packages except `packages/utils/` (which has a single spec file)
- Risk: Schema validation logic in `packages/schemas/` is shared between frontend and backend. Bugs here affect both layers simultaneously.
- Priority: Medium

## Missing Critical Features

**No Error Boundaries in Portal:**
- Problem: The portal Next.js app has no `error.tsx`, `loading.tsx`, or `not-found.tsx` files at any route level.
- Blocks: Unhandled errors in any page component will crash the entire app with a blank screen instead of showing a user-friendly error page.

**No Next.js Middleware:**
- Problem: Neither the portal nor the storefront apps have a `middleware.ts` file.
- Blocks: No server-side auth checks, no route protection, no locale detection at the edge. Auth is handled purely client-side.

**No Structured Logging:**
- Problem: Backend uses NestJS `Logger` in only 2 services (`StoresService`, `HostRoutingService`). All other services have no logging. The MinIO service uses `console.warn` instead of the NestJS logger.
- Files: `apps/backend/src/app/admin/stores/stores.service.ts`, `apps/backend/src/app/admin/stores/host-routing.service.ts`, `apps/backend/src/app/upload/minio-storage.service.ts`
- Blocks: No audit trail for data mutations, no observability into service behavior, difficult to debug production issues.

**Committed `error.log` in Repository Root:**
- Problem: An `error.log` file exists at the repository root containing `/bin/sh: gh: command not found`. This is a development artifact that should not be committed.
- Files: `/Users/kaanakin/Desktop/helix/error.log`
- Blocks: Nothing functionally, but it pollutes the repository and is not in `.gitignore`.

## Dependencies at Risk

**Zod v4 `.omit()` / `.extend()` Constraints:**
- Risk: Zod v4 breaks `.omit()` on schemas with `.check()` refinements and `.extend()` silently drops refinements. This is a known issue documented in project memory.
- Impact: Schema definitions must follow the `BaseFooSchema` pattern and use `.safeExtend()` instead of `.extend()`. Developers unaware of this constraint will introduce runtime errors.
- Migration plan: Already mitigated with conventions documented in `packages/schemas/CLAUDE.md`. Enforce via code review.

---

*Concerns audit: 2026-03-09*
