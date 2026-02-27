# Codebase Concerns

**Analysis Date:** 2026-02-27

## Tech Debt

**Zod v4 Schema Refinements Pattern:**
- Issue: `.omit()` cannot be used on schemas containing `.check()` refinements in Zod v4, causing runtime errors
- Files: `packages/schemas/src/admin/brands/`, `packages/schemas/src/admin/categories/`, `packages/schemas/src/admin/products/`, `packages/schemas/src/admin/tags/`, `packages/schemas/src/admin/variants/`
- Impact: Backend DTOs cannot simply omit file upload fields; requires maintaining parallel Base schema patterns for each entity
- Fix approach: This is mitigated by established pattern (`BaseBrandSchema` + `.check()` separate from frontend schema). Document is in `packages/schemas/CLAUDE.md`. Continue using this pattern for new entities.

**`.extend()` vs `.safeExtend()` Enforcement:**
- Issue: Using `.extend()` on schemas with `.check()` refinements silently drops refinements, causing validation bypass
- Files: `packages/schemas/src/admin/brands/brand-zod-schema.ts`, `packages/schemas/src/admin/categories/category-zod-schema.ts`, `packages/schemas/src/admin/tags/tag-group-zod-schema.ts` (all properly use `.safeExtend()`)
- Impact: Validation logic loss if wrong method used in future development
- Fix approach: Enforce via ESLint or TypeScript strict mode rules. Pattern documented in `packages/schemas/CLAUDE.md` §".safeExtend() only".

**Limited Unit Test Coverage:**
- Issue: Only 10 test files in monorepo (all E2E tests for auth module, 1 utility test)
- Files: `apps/backend-e2e/src/auth/`, `packages/utils/src/lib/utils.spec.ts`
- Impact: Admin CRUD modules, product management, rule engine, file upload service, pricing system lack unit test coverage
- Fix approach: Prioritize unit tests for `apps/backend/src/app/admin/` services and `apps/backend/src/core/utils/` (prisma-query-builder, rule-tree-evaluator)
- Priority: High

## Known Issues

**Token Refresh Race Condition (Fixed):**
- Issue: Fixed in commit `422711e` ("fix token refresh race condition")
- Status: Resolved
- Implementation: Token refresh interceptor in `apps/web/core/lib/api/api-client.ts` uses `isRefreshing` flag and `failedQueue` to serialize concurrent 401 responses

## Security Considerations

**JWT Secret Management:**
- Risk: `JWT_SECRET` and `JWT_REFRESH_SECRET` stored in `.env` files (not committed)
- Files: `apps/backend/.env`, `apps/web/.env` (ignored in .gitignore)
- Current mitigation: Separate secrets for access (short-lived) and refresh (long-lived) tokens. Refresh tokens family-tracked in database for anomaly detection
- Recommendations:
  - Rotate secrets regularly in production
  - Log token anomalies (family discontinuity) for audit trail
  - Consider key rotation strategy for multi-instance deployments

**File Upload Validation:**
- Risk: File MIME type detection via `detectFileType()` in `apps/backend/src/app/upload/upload.service.ts` relies on declared `mimeType` header
- Files: `apps/backend/src/app/upload/upload.service.ts` (lines 17-29)
- Current mitigation: Files processed through ImageProcessorService for images; file type enum constraint in Prisma schema
- Recommendations:
  - Add server-side magic bytes validation (not just MIME type check)
  - Enforce file size limits per file type via constants (`FileTypeConfigs` pattern)
  - Store original filename separately from uploaded path for security

**Database Query Injection via Filter Builder:**
- Risk: `buildPrismaQuery()` converts client filters to Prisma where clauses; filter values not explicitly validated
- Files: `apps/backend/src/core/utils/prisma-query-builder.ts`, `apps/backend/src/core/utils/prisma-condition-converters.ts`
- Current mitigation: Zod schemas validate query shape before reaching this function; Prisma client parameterizes queries
- Recommendations:
  - Add schema validation in `buildPrismaQuery()` entry point (type-safe by design currently)
  - Audit filter allowed fields per entity via config objects (already done via `MY_FIELD_CONFIG` pattern)

**i18n Error Message Translation Path Traversal:**
- Risk: Error messages use i18n keys directly (e.g., `'common.errors.brand_not_found'`); translation layer could be exploited
- Files: `apps/backend/src/app/auth/auth.controller.ts`, `apps/backend/src/app/admin/brands/brands.controller.ts`, all admin services
- Current mitigation: Keys are constants from `common/validation-keys.ts` and hardcoded in code (no user input in keys)
- Recommendations: Continue restricting keys to compiled constants; never interpolate user input into i18n paths

## Performance Bottlenecks

**N+1 Query Risk in Admin Lookups:**
- Problem: `lookup()` methods in admin services resolve by IDs without pagination; could fetch thousands of items into memory
- Files: `apps/backend/src/app/admin/brands/brands.service.ts` (line 97-120), `apps/backend/src/app/admin/tag-groups/tag-groups.service.ts`, `apps/backend/src/app/admin/categories/categories.service.ts`
- Cause: ID-based lookup mode has no limit parameter when resolving pre-selected items
- Improvement path:
  - Add optional `limit` parameter to ID resolution mode
  - Paginate ID lookups if `ids` array exceeds threshold (e.g., 100 items)
  - Document max recommended ID array size in CLAUDE.md

**Export Iterator Memory Accumulation:**
- Problem: Async generators in `*iterateXs()` methods load full batch into memory; no control over batch size in production
- Files: `apps/backend/src/app/admin/brands/brands.service.ts` (line 61-86), `apps/backend/src/app/admin/products/products.service.ts`, all admin entity services
- Cause: Hardcoded `batchSize` via export controller, default 1000 items per batch
- Improvement path:
  - Make batch size configurable per entity
  - Monitor memory usage in export tests
  - Consider streaming response via chunked encoding instead of loading full batch

**Tag Hierarchy Queries on Deep Trees:**
- Problem: `Tag` model has `parentTagId` self-reference and `depth` field; queries for children don't limit recursion depth
- Files: `packages/prisma/prisma/schema/tag.prisma` (line 51-73)
- Cause: No depth-aware query optimization; fetching all descendants of a tag requires multiple queries
- Improvement path:
  - Add query optimizer for hierarchical lookups (use `depth` field to limit fetches)
  - Document max recommended tree depth

## Fragile Areas

**Rule Engine Validator:**
- Files: `apps/backend/src/app/admin/rule-engine/rule-engine.validator.ts`, `apps/backend/src/core/utils/rule-tree-evaluator.ts`
- Why fragile: Complex recursive rule evaluation logic not covered by unit tests; JSON schema validation happens at runtime
- Safe modification: Add comprehensive unit tests before modifying evaluation logic; test edge cases (deep nesting, invalid operators)
- Test coverage: E2E tests missing; only integration via rule-tree controller tested

**Variant Combination Generation:**
- Files: `packages/utils/src/lib/products/variant-combinations.ts`, `apps/web/app/(admin)/admin/products/[id]/components/useVariantCombinations.ts`
- Why fragile: Generates all Cartesian products of variant options; no memory/performance bounds check
- Safe modification: Add validation for max combinations count (e.g., 10,000); warn user if approaching limit
- Test coverage: `packages/utils/src/lib/utils.spec.ts` has basic tests but lacks edge cases

**Image Processing Pipeline:**
- Files: `apps/backend/src/app/upload/image-processor.service.ts`, `apps/backend/src/app/upload/upload.service.ts`
- Why fragile: Sharp-based image processing runs in main thread; large file uploads could block API
- Safe modification: Add timeout for image processing; consider worker thread for heavy images
- Test coverage: No unit tests for image processor

**Multi-Locale Product Updates:**
- Files: `apps/backend/src/app/admin/products/products.service.ts`, `packages/prisma/prisma/schema/product.prisma`
- Why fragile: Product has many translation records (one per locale); updating one product with all locales hits database hard
- Safe modification: Use transaction for multi-locale updates; add test for concurrent update safety
- Test coverage: No unit tests for concurrent update scenarios

## Scaling Limits

**Database Connection Pool:**
- Current capacity: Default Prisma connection pool (varies by deployment)
- Limit: Each admin CRUD operation opens 2 queries (findMany + count); export iterators hold connections
- Scaling path:
  - Configure `DATABASE_URL` pool size explicitly (add `?max_pool_size=20` parameter)
  - Monitor connection usage in export operations
  - Consider read replica for export queries if production volume high

**Session/Device Tracking Storage:**
- Current capacity: Session and Device models grow indefinitely with user activity
- Limit: Large user base = millions of session records; queries by userId become slow without indexes
- Scaling path: Implement session cleanup (expire old sessions), implement pagination for device list endpoints
- Concern: See `packages/prisma/prisma/schema/session.prisma` — no TTL configured

**Geolocation Data Volume:**
- Current capacity: `Country`, `Region`, `City` models seeded once; no constraints on growth
- Limit: If adding dynamic geolocation updates, database could grow unbounded
- Scaling path: Add data retention policy; partition geolocation tables by region if needed

## Dependencies at Risk

**Prisma v7 + Adapter-PG:**
- Risk: Prisma 7 is relatively recent; edge cases in PG adapter may exist
- Impact: Adapter-PG used for connection pooling; issues could affect all database operations
- Migration plan: Monitor Prisma releases; test migrations in staging before production

**Zod v4:**
- Risk: Zod v4 introduced breaking changes (`.check()` vs `.refine()`, `.omit()` with refinements)
- Impact: All validation schemas must follow Zod v4 patterns; v3 code is incompatible
- Migration plan: Document is in `packages/schemas/CLAUDE.md`; all code already v4-compliant

**nestjs-zod v5:**
- Risk: DTO generation via `createZodDto()` is custom integration; upgrades may break type casting
- Impact: All backend DTOs depend on this pattern
- Migration plan: Lock to `"nestjs-zod": "^5.1.1"`; test carefully before upgrading

**Minio v8:**
- Risk: File storage depends on Minio SDK; missing features could require fallback storage
- Impact: File uploads fail if Minio service down
- Migration plan:
  - Implement fallback storage (local filesystem or cloud storage)
  - Add Minio health check to startup validation

**next-intl with Turbopack:**
- Risk: Next.js 16 Turbopack support for next-intl might have edge cases
- Impact: i18n locale switching could break during build or runtime
- Migration plan: Monitor next-intl releases; test Turbopack builds in CI

## Missing Critical Features

**Database Backup Strategy:**
- Problem: No documented backup/restore procedure in codebase
- Blocks: Cannot recover from data loss or ransomware
- Recommendation: Document backup cron job, test restore process monthly

**Rate Limiting:**
- Problem: API endpoints lack rate limiting; no protection against brute force or DDoS
- Blocks: Authentication endpoints vulnerable to password spray attacks
- Recommendation:
  - Add express-rate-limit middleware to NestJS app
  - Prioritize auth endpoints (/auth/login, /auth/register, /auth/refresh)

**Request Logging & Audit Trail:**
- Problem: No centralized request logging; difficult to audit who did what
- Blocks: Compliance requirements for e-commerce platforms
- Recommendation:
  - Log all admin operations (create, update, delete) with user ID and timestamp
  - Use Prisma audit tables (already have `AuditLog` model in schema)

**Error Monitoring (Sentry, etc):**
- Problem: No integration with error tracking service
- Blocks: Production errors go unnoticed until user reports
- Recommendation: Add Sentry or equivalent; configure in both backend and frontend

**Health Check Endpoint:**
- Problem: No `/health` endpoint for load balancers
- Blocks: Kubernetes/Docker Compose deployments can't detect unhealthy instances
- Recommendation: Add simple health check at `GET /api/health` with DB connection test

## Test Coverage Gaps

**Admin CRUD Service Tests:**
- What's not tested: `getBrands()`, `iterateBrands()`, `lookup()`, all other admin entity services
- Files: `apps/backend/src/app/admin/brands/brands.service.ts`, `apps/backend/src/app/admin/categories/categories.service.ts`, etc.
- Risk: Changes to query logic, filtering, or pagination could introduce bugs undetected
- Priority: High

**Prisma Query Builder:**
- What's not tested: `buildPrismaQuery()` with various filter combinations, edge cases (empty filters, invalid sort fields)
- Files: `apps/backend/src/core/utils/prisma-query-builder.ts`
- Risk: Filter logic bugs could expose unintended data or cause errors
- Priority: High

**Rule Engine Evaluation:**
- What's not tested: Recursive rule evaluation, edge cases (circular references, invalid operators), performance on deep trees
- Files: `apps/backend/src/core/utils/rule-tree-evaluator.ts`
- Risk: Rule evaluation could return incorrect results silently
- Priority: High

**Frontend Form Submission & Error Handling:**
- What's not tested: Form submission flows, error translation via `useFormErrorTranslator`, redirect on auth failure
- Files: `apps/web/app/(auth)/auth/components/LoginForm.tsx`, `apps/web/app/(auth)/auth/components/RegisterForm.tsx`
- Risk: User experience breakage on error paths
- Priority: Medium

**Image Upload & Processing:**
- What's not tested: Image format conversion, thumbnail generation, error handling for corrupted files
- Files: `apps/backend/src/app/upload/image-processor.service.ts`, `apps/backend/src/app/upload/upload.service.ts`
- Risk: File upload failures could leave orphaned files in Minio
- Priority: Medium

**Concurrent Token Refresh:**
- What's not tested: Multiple simultaneous 401 responses, edge cases in refresh queue processing
- Files: `apps/web/core/lib/api/api-client.ts` (lines 42-46)
- Risk: Race conditions in token refresh despite existing mitigation
- Priority: Medium

---

*Concerns audit: 2026-02-27*
