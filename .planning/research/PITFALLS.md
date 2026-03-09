# Domain Pitfalls

**Domain:** Self-hosted multi-tenant commerce platform (B2C + B2B)
**Researched:** 2026-03-09
**Confidence:** MEDIUM (training data only -- web search unavailable; findings based on deep domain knowledge of commerce platform patterns, verified against existing Helix schema)

---

## Critical Pitfalls

Mistakes that cause rewrites, data corruption, or fundamental architectural failures.

---

### Pitfall 1: Treating B2B Pricing as "Discounts on B2C Prices"

**What goes wrong:** The platform models B2B contract pricing as percentage discounts off the retail price. When the retail price changes, every contract customer's price silently shifts. A 10% retail increase instantly breaks a negotiated contract. Worse, historical orders show different "effective prices" when recalculated vs. what was actually charged.

**Why it happens:** B2C pricing is simpler (one price, maybe a sale price), and developers naturally extend it with a "discount" layer for B2B. The PriceList model already supports `adjustmentType` (PERCENTAGE/FIXED_AMOUNT) with inheritance -- this is the exact pattern that causes the problem when used as the *only* pricing mechanism for contracts.

**Consequences:**
- Contract customers see price fluctuations they did not agree to
- Disputes over invoiced amounts vs. agreed amounts
- No audit trail of "what was the agreed price at signing time"
- Price recalculation on order history shows wrong numbers

**Prevention:**
- Contract prices must be **snapshotted at agreement time**, not derived at query time
- Add a `ContractPriceAgreement` entity that locks prices for a date range, independent of the PriceList inheritance chain
- Orders must store the **resolved price at order time** (price snapshot), never re-derive from current price lists
- The existing `PriceListPrice` with `FIXED` origin type is correct for contract prices -- but it needs a validity period and an immutable reference from the order line item

**Warning signs:** No `effectivePrice` or `agreedPrice` field on order line items; price displayed to B2B buyer is always computed live from current PriceList.

**Detection:** Ask "if I change the base price right now, does any B2B customer's contract price change?" If yes, this pitfall is active.

**Phase relevance:** Must be addressed in the Order/Pricing phase. The order line item schema is the critical decision point.

---

### Pitfall 2: Order State Machine Without Explicit Transitions

**What goes wrong:** Order status is modeled as a simple enum column (`PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`, `REFUNDED`) updated with direct writes. Business rules like "only PENDING orders can be cancelled" or "B2B orders need approval before CONFIRMED" are scattered across service methods with `if/else` checks.

**Why it happens:** Enum-based status is easy to start with. The complexity is invisible until you need: B2B approval workflows, partial fulfillment, partial refunds, split shipments, payment capture timing.

**Consequences:**
- Invalid state transitions (order goes from DELIVERED to PENDING due to a bug)
- B2B approval workflow is bolted on as a separate "pre-order" status rather than integrated
- Partial fulfillment is impossible (the order is either "shipped" or not)
- No audit trail of *who* changed the status and *when*
- Race conditions: two concurrent requests both transition the same order

**Prevention:**
- Model order status as an **explicit state machine** with a transition table: `(currentState, event) -> nextState + sideEffects`
- Store transitions in an `OrderEvent` / `OrderStatusHistory` table with actor, timestamp, and reason
- B2B approval is a *state* in the machine (e.g., `PENDING_APPROVAL`), not a separate workflow
- Use optimistic locking (`version` column or `updatedAt` check) to prevent concurrent transitions
- Design for **order lines having independent statuses** from the start (line-level fulfillment)

**Warning signs:** Order service has methods like `cancelOrder()` that do `if (order.status !== 'PENDING') throw` scattered in multiple places. No `OrderEvent` table in the schema.

**Detection:** Can two items in the same order have different fulfillment statuses? If not, you have this pitfall.

**Phase relevance:** Must be designed in the Order Model phase, before any order processing logic is built. Retrofitting a state machine onto a simple enum is a rewrite.

---

### Pitfall 3: Multi-Tenant Data Leakage Through Missing Store Scoping

**What goes wrong:** A query forgets the `WHERE storeId = ?` clause, and Store A's customers see Store B's products, prices, or orders. Or worse, a B2B buyer in one store's organization can access another store's data through an API that does not filter by storeId.

**Why it happens:** Every single query in the system must be tenant-scoped. With Prisma, there is no automatic row-level security. Developers must manually add `storeId` filters to every `findMany`, `findFirst`, `update`, and `delete`. One missed filter = data leak.

**Consequences:**
- Cross-tenant data exposure (security incident)
- Price list from Store A applied to Store B's customer
- Organization in Store A sees products not assigned to their store

**Prevention:**
- **Prisma middleware or extension** that automatically injects `storeId` filter on every query for tenant-scoped models. Prisma Client Extensions (`$extends`) can intercept `findMany`/`findFirst` etc.
- Alternatively, create a `TenantPrismaClient` factory that returns a client pre-scoped to a storeId -- every service receives this instead of the raw PrismaClient
- Add integration tests that explicitly verify cross-tenant isolation: create data in Store A, query as Store B, assert empty results
- The existing `ProductStore` junction table is good -- but every API endpoint that returns products must join through it with the current store's ID

**Warning signs:** Services accept `storeId` as a parameter but do not validate it against the authenticated user's store context. No integration tests for cross-tenant isolation.

**Detection:** Search the codebase for Prisma queries on tenant-scoped models that lack a `storeId` filter. Any hit is a potential leak.

**Phase relevance:** Must be addressed as **infrastructure** before building storefront features. A tenant-scoping middleware/extension should be the first thing built in the Commerce phase.

---

### Pitfall 4: Cart/Checkout Designed for B2C Only, B2B Bolted On

**What goes wrong:** The cart and checkout flow is built for B2C first (single buyer, immediate payment, simple address). When B2B features are added, the team discovers the cart model cannot support: approval workflows (cart is "submitted" but not yet an order), payment terms (net-30 means no payment at checkout), purchase order numbers, shipping to multiple addresses, and cost center allocation.

**Why it happens:** B2C checkout is a well-understood pattern. The temptation is to build it first and "extend" it for B2B. But B2B checkout is fundamentally different: the person adding items to the cart may not be the person who approves the purchase.

**Consequences:**
- Cart model requires a rewrite to support "submitted for approval" state
- Payment integration assumes payment happens at checkout (breaks net-30/net-60)
- No place to attach PO numbers, cost centers, or budget codes
- The "place order" action means different things in B2C (charge card) vs. B2B (submit for approval)

**Prevention:**
- Design the cart/checkout abstraction to support **both flows from day one**:
  - `Cart` -> `DraftOrder` (B2B: submitted for approval) -> `Order` (B2B: approved and confirmed)
  - `Cart` -> `Order` (B2C: direct placement)
- The `DraftOrder` concept is the key B2B primitive. It is a cart that has been "submitted" but is not yet a committed order
- Add `paymentMethod` as a polymorphic concept: `IMMEDIATE` (card), `TERMS` (net-30), `QUOTE` (price TBD)
- Include `purchaseOrderNumber`, `costCenter`, `requestedBy`, `approvedBy` fields on the order model from the start, nullable for B2C

**Warning signs:** Cart model has `checkout()` that immediately creates an order and initiates payment. No concept of "draft order" or "order request".

**Detection:** Ask "can a B2B buyer submit a cart that requires manager approval before it becomes an order?" If the answer requires a hack, this pitfall is active.

**Phase relevance:** Cart/Checkout architecture phase. Must be designed before any checkout code is written.

---

### Pitfall 5: Inventory Not Isolated Per Tenant

**What goes wrong:** The existing warehouse and stock level models are well-structured (`StockLevel` per variant per warehouse per stock category). But if inventory operations do not enforce store-to-warehouse associations, Store A could theoretically allocate stock from Store B's warehouse.

**Why it happens:** The `Warehouse` model has a `storeId` field (good), but inventory reservation logic during checkout might query warehouses without filtering by the order's store.

**Consequences:**
- Overselling: Store A sells stock that belongs to Store B
- Inventory reports show incorrect available quantities
- Fulfillment confusion when the physical warehouse serves multiple stores

**Prevention:**
- Every inventory query (stock check, reservation, allocation) must filter by warehouses belonging to the current store
- Stock reservation during checkout must be atomic: `BEGIN TRANSACTION` -> check stock -> decrement -> `COMMIT` (or use `SELECT ... FOR UPDATE`)
- Add a `StockReservation` model that holds reserved-but-not-yet-fulfilled quantities, with expiration (abandoned carts release reservations)
- For B2B: reservations may need longer TTLs (approval workflows take time)

**Warning signs:** No `StockReservation` table. Checkout decrements stock directly without a reservation step. No `FOR UPDATE` or optimistic locking on stock mutations.

**Detection:** Two concurrent checkouts for the last unit of a product -- does one fail gracefully or do both succeed (oversell)?

**Phase relevance:** Inventory/Checkout phase. Must be solved before checkout goes live.

---

## Moderate Pitfalls

---

### Pitfall 6: Quote Workflow as a Separate System Instead of an Order Lifecycle State

**What goes wrong:** Quotes are built as a completely separate entity (`Quote`) with its own line items, pricing, and approval flow, disconnected from the order system. When a quote is accepted, its data must be manually copied into an order, leading to drift, duplication, and bugs.

**Why it happens:** Quotes feel different from orders -- they are "negotiable" and "not committed." Developers create a parallel data model.

**Prevention:**
- Model quotes as an **order in QUOTE state**. A quote is an order with `status: QUOTE` and `pricing: NEGOTIABLE`. When accepted, it transitions to `CONFIRMED` -- same entity, same line items, no data copying.
- The order state machine should include: `QUOTE_REQUESTED` -> `QUOTE_SENT` -> `QUOTE_ACCEPTED` -> `PENDING_APPROVAL` -> `CONFIRMED`
- Quote-specific fields (expiry date, negotiation notes, version history) are extensions on the order, not a separate model
- Keep quote *versions* (customer requests revision -> new version, old version preserved)

**Warning signs:** Separate `Quote` and `Order` tables with nearly identical columns. A "convert quote to order" function that copies fields.

**Phase relevance:** Order model design phase. Decide quote-as-order-state before building either quotes or orders.

---

### Pitfall 7: Approval Workflow Hardcoded Instead of Configurable

**What goes wrong:** B2B purchase approval is hardcoded as "manager must approve orders over $1000." When different organizations need different rules (e.g., "any order over $500 needs VP approval", "IT purchases need department head sign-off regardless of amount"), the code requires changes for each variation.

**Why it happens:** The first approval workflow is simple enough to hardcode. The second and third are "just another if/else." By the fifth, it is unmaintainable.

**Prevention:**
- Design approval as a **configurable rule engine** per organization:
  - `ApprovalPolicy`: conditions (amount threshold, product category, cost center) and required approver role/level
  - The existing `RuleTree` / `RuleTargetEntity` infrastructure can potentially be extended for this
- Use the `OrgMemberClosure` table (already in schema) to resolve "who is this buyer's manager" for hierarchical approvals
- Support multi-level approval chains: buyer -> manager -> VP (sequential) or buyer -> manager + finance (parallel)
- Always allow an organization OWNER to override/bypass approval

**Warning signs:** Approval logic lives in a single service method with hardcoded thresholds. No `ApprovalPolicy` or `ApprovalRule` entity.

**Phase relevance:** B2B Organization Features phase. Design the approval engine before building the first approval workflow.

---

### Pitfall 8: Payment Provider Abstraction That Is Either Too Thin or Too Thick

**What goes wrong (too thin):** The "payment abstraction" is just an interface with `charge(amount)` and `refund(amount)`. When you need to support payment intents, webhooks, idempotency keys, 3D Secure redirects, or partial captures, the abstraction breaks and provider-specific code leaks everywhere.

**What goes wrong (too thick):** The abstraction tries to model every possible payment provider feature upfront, creating a massive interface that no single provider fully implements, with unused methods throwing `NotImplementedError`.

**Why it happens:** Payment provider is TBD (noted in PROJECT.md). Without knowing the provider, the team either over-abstracts or under-abstracts.

**Prevention:**
- Design around the **payment lifecycle**, not the provider API:
  - `PaymentIntent` (created at checkout, amount + currency + metadata)
  - `PaymentAttempt` (each try to fulfill the intent -- may fail, retry)
  - `PaymentCapture` (successful charge, may be partial)
  - `PaymentRefund` (full or partial, references a capture)
- Provider adapters implement a focused interface: `createIntent()`, `capturePayment()`, `refundPayment()`, `handleWebhook()`
- Store the provider's raw response/event as JSON (`providerData`) for debugging -- do not try to normalize every field
- For B2B payment terms: `PaymentIntent` with `method: TERMS` skips the payment provider entirely and creates an `Invoice` instead
- Use idempotency keys on every mutation to handle webhook retries safely

**Warning signs:** No `PaymentIntent` or `PaymentAttempt` entity. Payment logic is a single `processPayment()` function. No webhook handler design.

**Phase relevance:** Payment Integration phase. Design the payment lifecycle model before selecting or integrating a provider.

---

### Pitfall 9: Search and Catalog Filtering Becomes a Performance Bottleneck

**What goes wrong:** Product search and filtering is implemented with Prisma `findMany` queries using `WHERE ... AND ... AND` clauses with `LIKE` for text search. Works fine with 100 products. At 10,000 products with faceted filtering (by category, price range, brand, attributes, availability), queries take seconds.

**Why it happens:** Prisma generates SQL. SQL is not great at full-text search or faceted filtering at scale. The team does not plan for a search index because the initial dataset is small.

**Consequences:**
- Storefront pages load slowly as catalog grows
- Faceted filtering (show counts per category/brand) requires expensive aggregation queries
- B2B custom catalogs (filtered product visibility per organization) add another dimension to already slow queries

**Prevention:**
- Plan for a **search index from day one** -- but do not build it day one. Design the data flow so it *can* be added without refactoring:
  - Product mutations should emit events (BullMQ jobs already exist in the stack) that *could* trigger search index updates
  - Storefront read queries should go through a `CatalogService` abstraction, not directly to Prisma
  - Phase 1: `CatalogService` uses Prisma queries (fine for small catalogs)
  - Phase 2: `CatalogService` switches to Meilisearch/Typesense behind the same interface
- For B2B catalog restrictions: use the `CustomerGroup` -> `PriceList` linkage to determine product visibility. Pre-filter at the search layer, not as a post-query filter
- Add database indexes on the most common filter columns (already partially done in the schema -- good)

**Warning signs:** Storefront product listing queries join 5+ tables with LIKE clauses. No `CatalogService` abstraction -- controllers query Prisma directly.

**Phase relevance:** Storefront/Catalog phase. Build the `CatalogService` abstraction in the first storefront phase, even if the implementation is just Prisma initially.

---

### Pitfall 10: Decimal/Money Arithmetic Done with JavaScript Floats

**What goes wrong:** Prices are stored as `Decimal` in Prisma/PostgreSQL (correct), but when they reach the NestJS service layer or the Next.js frontend, they are converted to JavaScript `number` (IEEE 754 float). `0.1 + 0.2 = 0.30000000000000004`. Rounding errors accumulate across line items, taxes, and discounts, producing invoices that are off by pennies.

**Why it happens:** Prisma returns `Decimal` as a `Prisma.Decimal` object (or string, depending on configuration). Developers call `.toNumber()` for convenience and lose precision.

**Consequences:**
- Invoice totals do not match sum of line items
- Tax calculations are off by fractions of a cent
- B2B customers with large orders (hundreds of line items) see meaningful rounding errors
- Financial reconciliation fails

**Prevention:**
- **Never convert Decimal to JavaScript number for arithmetic.** Use `Prisma.Decimal` (which wraps `decimal.js`) or a dedicated money library throughout the backend
- Define a `Money` value object: `{ amount: Decimal, currency: CurrencyCode }`. All price arithmetic goes through this type
- Rounding strategy: round each line item to currency precision (2 decimal places for TRY/USD/EUR/GBP), then sum. Never sum first, round later
- Frontend: receive prices as strings, format for display only. Never do price math on the client
- Store tax amounts as pre-calculated values on the order, not as percentages to be recalculated

**Warning signs:** `.toNumber()` calls on Decimal fields in service layer. No `Money` type or utility. Frontend doing price * quantity calculations.

**Phase relevance:** Must be established as a convention before the first price calculation is written. Pricing/Order phase.

---

## Minor Pitfalls

---

### Pitfall 11: i18n for Commerce Content vs. UI Labels

**What goes wrong:** The existing i18n system (3 namespaces: validation, backend, frontend) handles UI translations well. But commerce content (product names, descriptions, category names) uses a different pattern -- `ProductTranslation` table with locale column. These two systems can clash: a developer uses the UI i18n system for product content, or vice versa.

**Prevention:**
- Clearly document the boundary: **UI i18n** (next-intl, JSON files) is for interface labels. **Content i18n** (Translation tables in DB) is for merchant-created content
- Storefront components must know which system to use: `useTranslations()` for buttons/labels, `product.translations.find(t => t.locale === currentLocale)` for product data
- Consider a `useLocalizedContent(translations, field)` hook to standardize DB-based content resolution

**Phase relevance:** Storefront phase. Document the convention before building product display components.

---

### Pitfall 12: Docker Compose Self-Hosted Deployment Without Backup/Migration Strategy

**What goes wrong:** The platform is self-hosted via Docker Compose. Customers deploy it, add products, process orders. Then they need to upgrade to a new version. The upgrade requires a Prisma migration. The migration fails or corrupts data. There is no rollback path.

**Prevention:**
- Include a `backup` service/script in the Docker Compose stack that dumps PostgreSQL and MinIO before upgrades
- Prisma migrations must be **tested against production-like data** in CI, not just empty databases
- Version the Docker Compose stack and document the upgrade path: `docker compose down` -> backup -> pull new images -> `docker compose up` (migrations run automatically)
- Consider a health-check endpoint that reports current DB migration version vs. expected version
- For breaking migrations: provide a migration guide document per version

**Phase relevance:** Deployment/Operations phase. Should be addressed before the first public release.

---

### Pitfall 13: B2B Catalog Visibility as an Afterthought

**What goes wrong:** All products are visible to all customers. When B2B catalog restrictions are needed (Organization A can only see products X, Y, Z), the team adds a filter layer on top of the existing catalog. This filter is missed in some endpoints (search, recommendations, related products), leaking restricted products.

**Prevention:**
- Catalog visibility is a **first-class filter** applied at the data layer, not the presentation layer
- Use the existing `CustomerGroup` -> `PriceListCustomerGroup` linkage. Products without a price in the customer's price list are invisible
- Alternatively, add a `CatalogAssignment` model: `Organization -> Product[]` (explicit whitelist)
- Every endpoint that returns products must go through `CatalogService` which enforces visibility. No direct Prisma product queries from storefront controllers

**Phase relevance:** B2B Catalog phase. Design before building the B2B storefront product listing.

---

### Pitfall 14: Missing Idempotency on Critical Mutations

**What goes wrong:** A customer double-clicks "Place Order." Two orders are created. A webhook from the payment provider is retried. The order is charged twice. A BullMQ job fails and retries. The inventory is decremented again.

**Prevention:**
- Every order placement must use an **idempotency key** (generated client-side, sent with the request). Backend checks if an order with that key already exists before processing
- Payment webhook handlers must be idempotent: check if the event has already been processed before acting on it
- BullMQ jobs for inventory operations should store their result and check for prior completion on retry
- Add `idempotencyKey` fields to `Order` and `PaymentAttempt` models

**Phase relevance:** Checkout/Payment phase. Must be designed into the order creation flow from the start.

---

### Pitfall 15: Store BusinessModel Enum Prevents Hybrid B2C+B2B Stores

**What goes wrong:** The `Store` model has `businessModel: BusinessModel` which is either `B2C` or `B2B`. A merchant wants a single store that serves both consumer and business buyers. The enum forces a choice: create two stores (duplicate products, double management) or hack around the enum.

**Why it happens:** The initial design assumes clear separation. In practice, many merchants want one catalog with different pricing/checkout for consumer vs. business buyers.

**Prevention:**
- Consider whether a store should support **multiple business models simultaneously**. If yes:
  - Change `businessModel` from a single enum to a set/flags: `supportedModels: BusinessModel[]` or a boolean pair `supportsB2C`/`supportsB2B`
  - The storefront routing (Fastify router) already has separate B2C and B2B apps -- this is fine. The store just needs to be accessible from both
- If the decision is to keep strict separation (one store = one model), document it explicitly and ensure the admin UI makes it easy to manage two stores with shared products

**Warning signs:** Merchant asks "can my store sell to both consumers and businesses?" and the answer requires creating two stores.

**Detection:** Review the `BusinessModel` enum usage. If it gates product visibility, pricing, or routing in a way that prevents a hybrid store, this pitfall is active.

**Phase relevance:** Store architecture decision. Should be resolved before building storefront features.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Order Model Design | #2 (state machine), #6 (quote-as-order), #14 (idempotency) | Design the order state machine and lifecycle model before writing any order code. Include quote states. Add idempotency keys. |
| Pricing / Contract Pricing | #1 (B2B pricing as discounts), #10 (float arithmetic) | Snapshot prices on orders. Use Decimal everywhere. Define Money value object. |
| Cart / Checkout | #4 (B2C-only cart), #5 (inventory isolation), #14 (idempotency) | Design cart for both B2C and B2B flows. Add stock reservation with expiry. Idempotent order creation. |
| B2B Organization Features | #7 (hardcoded approval), #13 (catalog visibility) | Configurable approval policies. Catalog visibility as first-class filter. |
| Payment Integration | #8 (abstraction thickness), #14 (idempotency) | Model payment lifecycle, not provider API. Idempotent webhooks. |
| Storefront / Catalog | #9 (search performance), #11 (i18n confusion), #3 (tenant leakage) | CatalogService abstraction. Document i18n boundary. Tenant-scoping middleware. |
| Multi-Tenancy Infrastructure | #3 (data leakage), #5 (inventory isolation), #15 (hybrid stores) | Prisma extension for automatic storeId filtering. Integration tests for isolation. Decide on hybrid store support. |
| Deployment / Operations | #12 (backup/migration) | Backup scripts. Migration testing against production-like data. Versioned upgrade path. |

---

## Sources

- Analysis of existing Helix Prisma schema (organization.prisma, pricing.prisma, customer.prisma, product.prisma, store.prisma, enums.prisma)
- Commerce platform domain expertise (training data -- MEDIUM confidence, not web-verified due to search unavailability)
- Patterns observed in Medusa.js, Saleor, Vendure, Shopify Plus B2B documentation (training data, not verified against current versions)

**Confidence note:** Web search was unavailable during this research session. All findings are based on training data and analysis of the existing codebase. Recommendations are consistent with established commerce platform patterns but should be validated against current Medusa v2 / Saleor documentation for specific implementation approaches, particularly around order state machines and payment abstractions.
