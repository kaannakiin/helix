# Helix Commerce Platform

## What This Is

A self-hosted, multi-tenant commerce platform with three apps: an admin portal for store management, a B2C storefront for consumer shopping, and a B2B storefront for business buyers. The platform supports multiple domains and multiple storefront hosts per installation, with Caddy handling public ingress and on-demand TLS, and a Fastify router resolving hostnames to the correct storefront app.

## Core Value

Both B2C and B2B storefronts must be fully functional with distinct business flows, backed by complete admin capabilities — so a store owner can deploy, configure, and sell through either model.

## Requirements

### Validated

<!-- Shipped and confirmed valuable — inferred from existing codebase. -->

- ✓ Admin authentication (local + OAuth: Google, Facebook, Instagram) — existing
- ✓ JWT-based session management with httpOnly cookies and refresh tokens — existing
- ✓ Domain onboarding and host-based routing via Fastify storefront router — existing
- ✓ Multi-domain, multi-store architecture with Caddy TLS termination — existing
- ✓ Admin portal with Mantine UI, ag-grid data tables, i18n (en/tr) — existing
- ✓ Product management basics (CRUD, variants, categories, images via MinIO) — existing
- ✓ Customer management basics — existing
- ✓ Organization/store management — existing
- ✓ Shared schema validation (Zod 4) across frontend and backend — existing
- ✓ Export system (Excel/CSV) — existing
- ✓ File upload with MinIO object storage — existing

### Active

<!-- Current scope. Building toward these. -->

- [ ] B2C storefront: product browsing, search, filtering
- [ ] B2C storefront: shopping cart and checkout flow
- [ ] B2C storefront: customer authentication and account management
- [ ] B2C storefront: order placement and order history
- [ ] B2B storefront: organization account registration and management
- [ ] B2B storefront: multiple buyers per company with role-based access
- [ ] B2B storefront: approval workflows for purchases
- [ ] B2B storefront: negotiated/contract pricing and price lists
- [ ] B2B storefront: quote request and quote workflow
- [ ] B2B storefront: payment terms (net-30, net-60, etc.)
- [ ] B2B storefront: restricted/custom catalogs per organization
- [ ] B2B storefront: repeat ordering and bulk order support
- [ ] Admin: full product management (pricing rules, inventory tracking, advanced variants)
- [ ] Admin: order lifecycle (processing, fulfillment, returns, refunds)
- [ ] Admin: customer/organization management with B2B-specific views
- [ ] Admin: analytics and reporting dashboard
- [ ] Admin: store settings and configuration
- [ ] Payment integration (provider TBD)

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Mobile apps (native iOS/Android) — web-first, mobile later
- Marketplace / multi-vendor — single-vendor stores only for this milestone
- Subscription / recurring billing products — complexity deferred
- Shipping carrier API integrations — manual fulfillment is sufficient for now

## Context

- Nx monorepo with 5 apps and 8 shared packages, all TypeScript
- Backend: NestJS 11 with Prisma 7.4 (PostgreSQL 16), Redis 7, BullMQ for job queues
- Frontend: Next.js 16 (App Router), Mantine 8.3, ag-grid 35, TanStack Query 5
- Storefront router: Fastify 5 with http-proxy, domain resolution cache
- B2C and B2B storefronts exist as minimal scaffolds — early development stage
- i18n: 3 namespaces (validation, backend, frontend) with en/tr locales
- Schema pattern: Base/Frontend/Backend split with `.safeExtend()` and `.check()` conventions
- Docker Compose production stack with Caddy reverse proxy for TLS

## Constraints

- **Tech stack**: Must extend the existing Nx/NestJS/Next.js/Prisma architecture — no rewrites
- **B2B as first-class**: B2B is a distinct business model with its own domain logic, not a B2C skin
- **Multi-tenancy**: All features must work across multiple stores and domains
- **Self-hosted**: Platform must remain fully self-hostable via Docker Compose
- **Payment provider**: TBD — architecture must be provider-agnostic to allow future selection

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| B2B as separate app, not B2C variant | Different domain logic (orgs, approvals, quotes, contract pricing) warrants separation | — Pending |
| Fastify router for host-based routing | Decouples storefront resolution from app logic, supports multiple upstreams | ✓ Good |
| Caddy for TLS and ingress | On-demand TLS for multi-domain, simple config, automatic HTTPS | ✓ Good |
| Zod 4 shared schemas with Base/Frontend/Backend split | Avoids `.omit()` issues with `.check()`, enables file upload pattern | ✓ Good |
| Payment provider deferred | Avoid premature commitment — build provider-agnostic payment abstraction | — Pending |

---
*Last updated: 2026-03-09 after initialization*
