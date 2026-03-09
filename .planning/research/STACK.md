# Technology Stack: Commerce Additions

**Project:** Helix Commerce Platform
**Researched:** 2026-03-09
**Scope:** Additional libraries for commerce features on top of existing NestJS 11 / Next.js 16 / Prisma 7.4 stack

## Existing Stack (Not Re-Researched)

The following are already in place and validated: NestJS 11, Next.js 16, Fastify 5 router, Prisma 7.4, Mantine 8.3, Zod 4.3, TanStack Query 5, Zustand 5, BullMQ 5, Redis (ioredis 5), MinIO, ag-grid 35, React Hook Form 7, Passport 0.7, Jose 6, dayjs, ExcelJS, Immer 11.

---

## Recommended Additions

### Payment Processing

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| `stripe` | ^20.4.1 | Primary payment provider SDK | Industry standard, best-in-class API, webhooks, comprehensive docs, supports B2B invoicing and payment terms. Actively maintained (latest release 2026-03-06). Use the SDK directly -- NestJS wrappers like `@golevelup/nestjs-stripe` (1.2.0) or `nestjs-stripe` (1.0.0) add thin convenience but lag behind SDK releases and constrain webhook handling. | HIGH |
| `iyzipay` | ^2.0.65 | Turkish market payment provider | Required for Turkish merchants (local cards, installments, BKM Express). The official iyzico SDK. No NestJS wrapper exists -- use directly behind the same payment abstraction interface as Stripe. | HIGH |

**Architecture note:** Build a `PaymentProvider` interface (strategy pattern) in the backend. Each provider (Stripe, iyzico) implements `createPayment`, `capturePayment`, `refundPayment`, `handleWebhook`. Store selection is per-tenant in the database. This keeps the codebase provider-agnostic per PROJECT.md constraint.

**Why NOT:**
- `@golevelup/nestjs-stripe` -- Thin wrapper that couples you to Stripe's module lifecycle. Direct SDK + custom NestJS service gives more control over webhook signature verification and multi-tenant provider switching.
- `PayPal SDK` -- Out of scope for Turkish market focus. Add later behind the same interface if needed.
- `Adyen` -- Enterprise pricing, overkill for self-hosted platform.

### Money/Currency Handling

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| `currency.js` | ^2.0.4 | Monetary value arithmetic | Lightweight (3KB), handles floating-point precision with integer math internally, simple API (`currency(10.5).add(5.25)`). Better than `dinero.js` for this project because Dinero v2 alpha has been stalled for years and the v1 API is dated. currency.js is stable, well-tested, and sufficient for commerce math. | HIGH |

**Why NOT:**
- `dinero.js` v2 (2.0.0-alpha.1) -- Still in alpha after years. Unstable API. Do not use alpha for money math.
- `dinero.js` v1 (2.0.1 on npm as `dinero.js`) -- Works but API design is older (Intl-heavy), heavier than needed.
- Raw integer math -- Error-prone, reinventing the wheel. currency.js does it correctly.

### Order State Machine

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| `xstate` | ^5.28.0 | State machine for order lifecycle, quote workflows, approval flows | Orders have complex state transitions (pending -> confirmed -> processing -> shipped -> delivered, with branches for cancellation, partial fulfillment, returns, refunds). B2B adds quote states (draft -> submitted -> negotiating -> accepted -> converted-to-order) and approval states. XState v5 is TypeScript-native, has excellent visualization tools, and prevents invalid state transitions at compile time. Critical for B2B approval workflows. | HIGH |

**Why NOT:**
- Custom switch/case state management -- Works for simple flows but becomes unmaintainable with B2B complexity (approval chains, quote negotiation, partial states). XState prevents impossible transitions by design.
- `robot` / `stately` -- Smaller ecosystem, fewer integrations, less community support.

### Event System

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| `@nestjs/event-emitter` | ^3.0.1 | Domain event bus for commerce events | Order placed, payment received, stock updated, quote status changed -- these events trigger side effects (email notifications, inventory updates, analytics). Official NestJS package, integrates with DI container. Already part of NestJS ecosystem so zero learning curve. | HIGH |

**Why NOT:**
- Raw Node.js EventEmitter -- No DI integration, no decorator support, harder to test.
- External message broker (RabbitMQ, Kafka) -- Overkill for single-instance self-hosted. BullMQ already handles async job processing. Event emitter handles synchronous domain events within the process.

### Email (Transactional)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| `@nestjs-modules/mailer` | ^2.0.2 | NestJS mailer module | Wraps nodemailer with NestJS DI, template support, transport abstraction. | HIGH |
| `nodemailer` | ^8.0.2 | SMTP transport (peer dep) | Industry standard Node.js email sending. Self-hosted means SMTP relay, not SaaS API. | HIGH |
| `@react-email/components` | ^1.0.8 | Email templates | Build email templates as React components. The project already uses React (Next.js 16), so the team knows JSX. Produces reliable cross-client HTML. Better than Handlebars for a React-native team. | MEDIUM |

**Why NOT:**
- `@sendgrid/mail`, `@aws-ses` -- SaaS dependencies. Self-hosted constraint means SMTP relay (Postfix, Mailcow, etc.).
- `handlebars` (4.7.8) -- Works but inferior DX for a React team. react-email produces better cross-client output.
- `mjml` -- Another viable option but react-email has better ergonomics with TypeScript.

### Search

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| `meilisearch` | ^0.55.0 | Product search client SDK | Full-text search, faceted filtering, typo tolerance. Self-hostable (Docker), fast indexing, simple API. MeiliSearch server added to Docker Compose stack. Better than Typesense for this use case because of simpler setup and better faceted search DX for ecommerce (price ranges, categories, attributes). Better than Elasticsearch which is massively over-engineered for this scale. | MEDIUM |

**Why NOT:**
- PostgreSQL `pg_trgm` + full-text search -- Viable for MVP but lacks faceting, typo tolerance, and relevance tuning. Upgrade path is painful. Start with Meilisearch.
- `elasticsearch` / `opensearch` -- Resource-heavy (JVM), complex ops, overkill for self-hosted single-tenant.
- `typesense` (3.0.2) -- Good alternative but Meilisearch has broader community adoption and better docs.
- `algolia` -- SaaS-only, violates self-hosted constraint.

### Rate Limiting

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| `@nestjs/throttler` | ^6.5.0 | API rate limiting | Checkout, payment, and cart endpoints need rate limiting to prevent abuse. Official NestJS package, supports Redis storage for multi-instance. | HIGH |

### Scheduled Tasks

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| `@nestjs/schedule` | ^6.1.1 | Cron jobs | Cart expiry cleanup, abandoned cart reminders, quote expiry, periodic inventory sync. Official NestJS package using `cron` under the hood. | HIGH |

### PDF Generation

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| `pdf-lib` | ^1.17.1 | Invoice and quote PDF generation | Pure JavaScript, no native dependencies, works in Node.js. Generates invoices, packing slips, quotes as PDFs. No Puppeteer/Chrome dependency means lighter Docker images. | HIGH |

**Why NOT:**
- `@react-pdf/renderer` (4.3.2) -- Heavier, requires React rendering pipeline on backend, slower for simple documents.
- `puppeteer` / `playwright` for PDF -- Requires headless Chrome in Docker, massive image size increase, fragile.
- `pdfkit` -- Similar capability but pdf-lib has better API for template-based generation.

### ID Generation

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| `nanoid` | ^5.1.6 | Human-friendly order/quote/invoice IDs | Generate short, URL-safe, unique IDs for customer-facing references (ORD-xK9b2mQ, QUO-3nR8vP). Better UX than UUIDs for order confirmation screens and emails. Prisma handles DB primary keys (cuid); nanoid handles display IDs. | HIGH |

---

## Storefront Frontend Additions

These apply to `apps/b2c-storefront` and `apps/b2b-storefront` (both Next.js 16).

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| `zustand` | (already 5.x) | Cart state | Already in the stack. Use a dedicated cart store with persistence (`zustand/middleware` persist to localStorage). No new dependency needed. | HIGH |
| `@tanstack/react-query` | (already 5.x) | Server state | Already in the stack. Use for product listings, order history, search results. Optimistic updates for cart mutations. | HIGH |
| `nuqs` | latest | URL search params state | Type-safe URL state for product filters, search queries, pagination. Better than manual `useSearchParams` for complex filter UIs. Verify latest version at install time. | MEDIUM |

**Why NOT new frontend state libs:**
- `jotai`, `recoil` -- Zustand is already in the stack and handles cart state perfectly.
- `swr` -- TanStack Query is already in the stack and more feature-rich.
- `redux-toolkit` -- Massive overkill, Zustand is lighter and already established.

---

## Infrastructure Additions (Docker Compose)

| Service | Image | Purpose | Why |
|---------|-------|---------|-----|
| MeiliSearch | `getmeili/meilisearch:latest` | Product search engine | Self-hosted, low resource, fast. Add to existing Docker Compose. |
| SMTP Relay (optional) | `mailhog/mailhog` (dev) | Email testing in development | Catches all outgoing email locally. Production uses real SMTP relay. |

---

## Prisma Schema Extensions Needed

No new ORM or database -- Prisma 7.4 + PostgreSQL 16 handles everything. But the schema needs these new models:

- `Cart`, `CartItem` -- Server-side cart (not just client state) for persistence across devices
- `Order`, `OrderItem`, `OrderStatusHistory` -- Order lifecycle with audit trail
- `Payment`, `PaymentTransaction` -- Payment records linked to orders
- `Invoice` -- Generated from orders, linked to payments
- `Quote`, `QuoteItem`, `QuoteStatusHistory` -- B2B quote workflow
- `PriceList`, `PriceListEntry` -- B2B contract/negotiated pricing per organization
- `ApprovalRule`, `ApprovalRequest` -- B2B purchase approval workflows
- `Address` -- Billing/shipping addresses for customers and organizations

These are schema design concerns, not library additions.

---

## Alternatives Considered (Summary)

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Payment | Stripe SDK direct | `@golevelup/nestjs-stripe` | Wrapper lags SDK, limits webhook control |
| Payment (TR) | iyzipay | Param, PayTR | iyzico has best SDK quality and market share |
| Money | currency.js | dinero.js v2 | v2 stuck in alpha for years |
| State machine | xstate 5 | Custom switch/case | Unmaintainable with B2B complexity |
| Search | MeiliSearch | Elasticsearch | ES is overkill, heavy JVM, complex ops |
| Email templates | react-email | Handlebars | React team, better cross-client HTML |
| PDF | pdf-lib | Puppeteer | No Chrome in Docker, lighter images |
| Email sending | nodemailer + nestjs-modules/mailer | SendGrid API | Self-hosted constraint |

---

## Installation Plan

```bash
# Backend (apps/backend)
npm install stripe@^20.4.1 iyzipay@^2.0.65 currency.js@^2.0.4 xstate@^5.28.0 \
  @nestjs/event-emitter@^3.0.1 @nestjs/schedule@^6.1.1 @nestjs/throttler@^6.5.0 \
  @nestjs-modules/mailer@^2.0.2 nodemailer@^8.0.2 \
  meilisearch@^0.55.0 pdf-lib@^1.17.1 nanoid@^5.1.6

# Backend dev dependencies
npm install -D @types/nodemailer @types/currency.js

# Email templates (new package: packages/email-templates)
npm install @react-email/components@^1.0.8 react-email@^5.2.9

# Storefronts (apps/b2c-storefront, apps/b2b-storefront)
npm install meilisearch@^0.55.0 nuqs
# zustand and @tanstack/react-query already installed
```

---

## What Explicitly NOT to Add

| Library | Why Not |
|---------|---------|
| `medusa-js` / Medusa | Full commerce engine -- competes with Helix, not a library to integrate |
| `saleor` SDK | Same -- it is a platform, not a composable library |
| `commercetools` SDK | SaaS, enterprise pricing, vendor lock-in |
| `shopify-api` | SaaS dependency, violates self-hosted |
| `RabbitMQ` / `Kafka` | Overkill for single-instance self-hosted; BullMQ + event-emitter covers async + sync events |
| `GraphQL` | REST is established in the codebase. Adding GraphQL for storefronts creates two API paradigms to maintain. Not worth the complexity for the feature set described. |
| `tRPC` | Same concern -- introduces a third API paradigm alongside REST |
| `Prisma Pulse` / `Prisma Accelerate` | Cloud-only Prisma features, violates self-hosted constraint |

---

## Sources and Confidence Notes

All version numbers verified via `npm view [package] version` on 2026-03-09 (live registry data).

| Source | Usage |
|--------|-------|
| npm registry (live) | Version verification for all packages |
| Training data (May 2025) | Library capability descriptions, architecture patterns |

**Confidence caveat:** Library capability descriptions come from training data. Version numbers are verified live. For any library where the API may have changed significantly between May 2025 and March 2026, verify with official docs before implementation. Key risk areas: XState v5 API (verify actor model), react-email component API, Stripe SDK v20 breaking changes from v17.

---

*Stack research: 2026-03-09*
