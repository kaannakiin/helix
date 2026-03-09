# Project Research Summary

**Project:** Helix Commerce Platform
**Domain:** Self-hosted multi-tenant B2C + B2B commerce platform
**Researched:** 2026-03-09
**Confidence:** HIGH

## Executive Summary

Helix is a self-hosted, multi-tenant commerce platform targeting both B2C and B2B storefronts, built on an existing NestJS 11 / Next.js 16 / Prisma 7.4 stack with sophisticated data models already in place (organizations with closure tables, price lists with inheritance, warehouse management, customer groups with rule engines). The hardest data modeling work is done. What remains is primarily storefront UI, checkout/order business logic, B2B workflow orchestration, and payment integration. The recommended approach is to build B2C checkout first as the foundation, then layer B2B primitives (approvals, quotes, payment terms) on top -- but the cart and order models must be designed for both flows from the start to avoid costly rewrites.

The stack additions are conservative and well-chosen: Stripe + iyzipay behind a provider interface for payments, XState v5 for order/quote state machines, currency.js for money arithmetic, MeiliSearch for eventual product search, and react-email for transactional templates. No new frameworks or paradigms -- everything integrates into the existing NestJS module pattern. The key architectural pattern is "shared domain services with split admin/storefront controllers," which preserves the existing API surface separation while avoiding logic duplication.

The top risks are: (1) multi-tenant data leakage from missing store-scoping on queries -- needs a Prisma extension as infrastructure before any storefront work; (2) B2B pricing modeled as discounts instead of snapshotted contract prices -- orders must store resolved prices immutably; (3) order state machine complexity -- use XState from the start rather than enum-based status with scattered if/else guards; (4) cart/checkout designed for B2C only then painfully retrofitted for B2B approvals and payment terms. All four are preventable with upfront design decisions in the first two phases.

## Key Findings

### Recommended Stack

The existing stack covers 90% of needs. Additions are targeted at commerce-specific concerns. All versions verified against npm registry on 2026-03-09.

**Core additions:**
- **Stripe SDK + iyzipay**: Payment providers behind a strategy interface -- Stripe for international, iyzipay for Turkish market. Use SDKs directly, not NestJS wrappers that lag releases.
- **XState v5**: Order lifecycle and quote workflow state machines -- TypeScript-native, prevents invalid transitions at compile time. Critical for B2B approval chains.
- **currency.js**: Money arithmetic without floating-point errors -- lightweight, stable, replaces the need for dinero.js (stuck in alpha).
- **@nestjs/event-emitter**: Domain event bus for commerce side effects (stock updates, notifications, analytics) -- official NestJS package, zero learning curve.
- **MeiliSearch**: Full-text product search with faceting and typo tolerance -- self-hostable, but deferred to after MVP. PostgreSQL full-text is sufficient initially.
- **react-email + nodemailer**: Transactional email templates as React components via SMTP -- self-hosted constraint rules out SaaS email providers.
- **pdf-lib**: Invoice/quote PDF generation without Puppeteer/Chrome dependency.
- **nanoid**: Human-readable order/quote/invoice IDs (ORD-xK9b2mQ) alongside Prisma cuid primary keys.

**Infrastructure additions:** MeiliSearch container in Docker Compose, MailHog for dev email testing.

### Expected Features

**Must have (table stakes):**
- B2C: Product catalog, PDP, shopping cart, guest + registered checkout, order history, customer auth, category nav, basic search, responsive design, SEO, email notifications
- B2B: Company account registration with approval, multi-buyer orgs, role-based purchasing, purchase approval workflows, contract/negotiated pricing, payment terms (net-30/60), quote request workflow, org-wide order history, bulk/quick order entry, restricted catalogs
- Admin: Order management dashboard, order lifecycle, manual order creation, inventory visibility, price list management, tax/shipping configuration, basic reporting

**Should have (differentiators):**
- Advanced search (MeiliSearch), wishlists, tiered/volume pricing, discount codes/coupons, saved carts/draft orders, PO number support, abandoned cart recovery, multi-currency display, order export, admin audit trail, webhook notifications

**Defer (v2+):**
- Promotions engine, budget management, multi-address shipments, product reviews, AI recommendations, subscription billing, marketplace, native apps, carrier API integration, built-in email marketing

### Architecture Approach

Commerce features integrate through two expansion points: new NestJS modules under `storefront/` for customer-facing APIs and under `admin/` for management. A new `shared/` layer holds domain services (cart, order, payment, pricing, notification) that both API surfaces consume. Every storefront endpoint is store-scoped via a `@Store()` param decorator extracting headers injected by the existing Fastify storefront router. The payment system uses a provider interface (strategy pattern) so Stripe, iyzipay, or any future provider slots in without touching order/checkout logic.

**Major components:**
1. **CartModule** -- Server-side cart with DB persistence, price snapshots, anonymous-to-auth merge
2. **CheckoutModule** -- Orchestrates cart validation, price re-check, inventory reservation, payment initiation
3. **OrderModule** -- XState-driven order lifecycle with audit trail, supports both B2C direct and B2B approval flows
4. **PaymentModule** -- Provider-agnostic payment intent/capture/refund lifecycle with webhook handling
5. **PricingService** -- Price resolution chain: base -> sale -> customer group -> contract (B2B)
6. **QuoteModule** -- B2B quote request/negotiation/acceptance, converts to order
7. **B2BAccountModule** -- Org registration, member management, configurable approval policies
8. **NotificationModule** -- Transactional emails via BullMQ async jobs
9. **CatalogModule** -- Product browsing abstraction (Prisma now, MeiliSearch later)

### Critical Pitfalls

1. **Multi-tenant data leakage** -- Build a Prisma Client Extension that auto-injects `storeId` filters on every query. Add integration tests for cross-tenant isolation. This is infrastructure that must exist before any storefront feature.
2. **B2B pricing as discounts** -- Contract prices must be snapshotted, not derived from live price lists. Orders store resolved prices immutably. A base price change must never silently shift a contract customer's agreed price.
3. **Order state machine as scattered if/else** -- Use XState with an explicit transition table from day one. Include B2B states (PENDING_APPROVAL, QUOTE_REQUESTED) in the initial design. Store every transition in OrderStatusHistory.
4. **Cart/checkout designed for B2C only** -- Design cart and order models with B2B fields (PO number, cost center, approval status, payment terms) from the start, nullable for B2C. The "place order" action must support both immediate payment and approval-then-invoice flows.
5. **Floating-point money arithmetic** -- Never call `.toNumber()` on Prisma Decimal fields. Use currency.js or Prisma.Decimal for all arithmetic. Round per line item, then sum. Frontend receives prices as strings for display only.

## Implications for Roadmap

### Phase 1: Commerce Infrastructure + Storefront Catalog
**Rationale:** Foundation that every subsequent phase depends on. Tenant-scoping middleware prevents data leakage from the start. Catalog abstraction enables product browsing without new schema.
**Delivers:** Store context decorator/guard, tenant-scoping Prisma extension, CatalogModule (product listing, filtering, category nav), customer account pages (login/register already works, add address book), storefront layout/responsive shell.
**Addresses:** Product catalog browsing, category navigation, customer auth UI, responsive design, basic SEO.
**Avoids:** Pitfall #3 (tenant leakage), Pitfall #9 (search bottleneck -- builds the CatalogService abstraction early), Pitfall #11 (i18n -- documents content vs. UI translation boundary).
**New schema:** `address.prisma` (CustomerAddress).

### Phase 2: Cart + Pricing Engine
**Rationale:** Cart is the prerequisite for checkout. Pricing must be resolved server-side before any purchase flow. Designing the cart model for both B2C and B2B prevents the #4 pitfall.
**Delivers:** Server-side cart (Cart, CartItem models), PricingService (base -> sale -> group -> contract resolution chain), inventory availability checks, cart API endpoints.
**Uses:** currency.js (money arithmetic from day one), existing PriceList/StockLevel models.
**Implements:** CartModule, PricingService, InventoryReservationService.
**Avoids:** Pitfall #4 (B2C-only cart -- include B2B fields from start), Pitfall #10 (float arithmetic -- establish Money conventions), Pitfall #1 (pricing as discounts -- design contract price snapshots).
**New schema:** `cart.prisma`.

### Phase 3: Checkout + Orders + Payment Abstraction
**Rationale:** Converts cart into orders. The order state machine and payment abstraction are the core commerce primitives. Must include B2B order states in the initial design.
**Delivers:** Checkout flow (address, shipping, payment initiation), order creation, order state machine (XState), payment provider interface (no concrete provider yet -- use manual/mock), order confirmation emails, admin order list/detail views.
**Uses:** XState v5 (order state machine), @nestjs/event-emitter (order events), nanoid (order numbers), react-email + nodemailer (order confirmation), pdf-lib (invoice generation).
**Implements:** CheckoutModule, OrderModule, PaymentModule (interface only), NotificationModule.
**Avoids:** Pitfall #2 (state machine -- XState from day one), Pitfall #5 (inventory isolation -- stock reservation with store-scoped warehouses), Pitfall #6 (quote as separate system -- include QUOTE states in order machine), Pitfall #14 (idempotency -- idempotency keys on order creation and payment).
**New schema:** `order.prisma`, `checkout.prisma`.

### Phase 4: B2B Commerce
**Rationale:** Builds on B2C checkout foundation with B2B-specific flows. Organization infrastructure already exists in the data model.
**Delivers:** Company account registration + admin approval, buyer management, contract pricing display, restricted catalogs, purchase approval workflows (configurable per org), quote request/negotiation/acceptance, bulk/quick order entry, PO number support, reorder from history.
**Uses:** XState v5 (quote state machine, approval state machine), existing Organization/OrgMemberClosure models.
**Implements:** B2BAccountModule, QuoteModule, approval policy engine.
**Avoids:** Pitfall #7 (hardcoded approval -- configurable ApprovalPolicy from start), Pitfall #13 (catalog visibility -- first-class filter via CatalogService).
**New schema:** `quote.prisma`, `approval.prisma`.

### Phase 5: Payment Provider Integration
**Rationale:** Deferred deliberately so all order/checkout logic develops against the abstraction. Now implement concrete providers.
**Delivers:** Stripe integration (international cards, webhooks, 3D Secure), iyzipay integration (Turkish cards, installments), B2B invoice/NET terms payment tracking, end-to-end payment testing.
**Uses:** Stripe SDK v20, iyzipay v2, @nestjs/throttler (rate limit payment endpoints).
**Avoids:** Pitfall #8 (abstraction thickness -- the interface has been battle-tested by phases 3-4 before provider implementation).

### Phase 6: Admin Commerce + Operations
**Rationale:** Admin needs mature order data to be useful. Parallel-safe with Phase 4/5 since it only reads/manages existing orders.
**Delivers:** Order lifecycle management (fulfill, ship, cancel, refund), fulfillment flow with StockMovement GOODS_ISSUE, returns/refunds, revenue reporting, customer/org management extensions, tax/shipping configuration UI, backup/migration tooling.
**Uses:** @nestjs/schedule (cart expiry, abandoned cart cleanup), ExcelJS (order export).
**Avoids:** Pitfall #12 (deployment -- backup scripts and migration testing before release).

### Phase Ordering Rationale

- **Infrastructure first** (Phase 1): Tenant scoping and catalog abstraction are used by every subsequent phase. Building them first prevents security holes and architectural debt.
- **Cart before checkout** (Phase 2 before 3): Data dependency -- checkout consumes cart. Pricing engine must exist before any purchase math.
- **B2C before B2B** (Phase 3 before 4): B2B extends B2C flows with approvals/quotes, it does not replace them. But the models are designed for both from the start.
- **Payment provider last** (Phase 5): The abstraction interface lets phases 3-4 use a mock provider. Concrete integration is isolated and testable.
- **Admin operations parallel** (Phase 6): Can start as soon as orders exist (Phase 3). Does not block storefront development.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (Checkout + Orders):** XState v5 actor model API may have changed since training data. Verify state machine definition patterns against current docs. Payment lifecycle modeling needs concrete provider research.
- **Phase 4 (B2B Commerce):** Approval workflow engine design is complex. Research Vendure/Saleor/OroCommerce approval patterns for implementation guidance.
- **Phase 5 (Payment Integration):** Stripe SDK v20 and iyzipay v2 APIs need current documentation review. Webhook verification, 3D Secure flow, and installment handling are provider-specific.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Infrastructure + Catalog):** Well-established NestJS patterns. Prisma extensions are documented. Product listing is straightforward.
- **Phase 2 (Cart + Pricing):** Server-side cart is a standard pattern. Price list resolution is custom but the data model already exists.
- **Phase 6 (Admin + Operations):** CRUD management views, reporting queries, and Docker deployment are well-documented patterns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified via npm registry. Library capabilities from training data (May 2025) -- verify XState v5 and Stripe v20 APIs against current docs before implementation. |
| Features | HIGH | Commerce feature landscape is mature and stable. B2C/B2B categorization consistent across all major platforms (Shopify, Magento, Saleor, OroCommerce). |
| Architecture | HIGH | Patterns derived from existing codebase conventions. Module structure, auth guards, and API split are already established. Commerce modules follow the same patterns. |
| Pitfalls | MEDIUM | Based on training data and schema analysis, not web-verified. Recommendations align with established commerce patterns but specific implementation approaches (especially XState v5, Prisma extensions) should be validated against current docs. |

**Overall confidence:** HIGH

### Gaps to Address

- **XState v5 API verification:** The actor model API may have evolved since May 2025 training data. Run a spike to verify state machine definition, transition handling, and persistence patterns before Phase 3 implementation.
- **Stripe SDK v20 breaking changes:** Verify payment intent, webhook, and 3D Secure APIs against current Stripe docs. The SDK jumped from v17 area to v20.
- **iyzipay SDK quality:** The official SDK has historically had sparse TypeScript types. Evaluate whether a wrapper or type augmentation is needed.
- **Hybrid B2B+B2C store decision:** Pitfall #15 identifies that the current `BusinessModel` enum forces one model per store. This architectural decision needs explicit resolution before storefront work begins -- either support hybrid or document the two-store approach.
- **MeiliSearch timing:** Research recommends deferring to post-MVP, but the CatalogService abstraction should be designed to accommodate it. Validate MeiliSearch faceted search capabilities against the specific product attribute structure.
- **react-email current API:** Verify component library and rendering pipeline against current docs before building email templates.

## Sources

### Primary (HIGH confidence)
- npm registry (live, 2026-03-09) -- version verification for all recommended packages
- Existing Helix codebase -- Prisma schemas, NestJS module structure, storefront router, auth patterns

### Secondary (MEDIUM confidence)
- Training data (May 2025) -- library capabilities, commerce domain patterns, architecture approaches
- Commerce platform patterns (Medusa, Saleor, Vendure, Shopify Plus, OroCommerce) -- feature categorization, B2B workflow patterns

### Tertiary (LOW confidence)
- XState v5 specific API patterns -- may have changed post-training data, needs validation
- Stripe SDK v20 API surface -- version jump from training data era, needs current docs review

---
*Research completed: 2026-03-09*
*Ready for roadmap: yes*
