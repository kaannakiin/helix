# Architecture Patterns

**Domain:** Self-hosted multi-tenant commerce platform (B2C + B2B)
**Researched:** 2026-03-09

## Recommended Architecture

Commerce features integrate into the existing architecture through two expansion points: new NestJS modules under `apps/backend/src/app/storefront/` for storefront-facing APIs, and new NestJS modules under `apps/backend/src/app/admin/` for admin management. The storefronts (B2C/B2B Next.js apps) consume the storefront API exclusively. The admin portal consumes the admin API exclusively. Both API surfaces share the same Prisma client and domain services.

### High-Level System Diagram

```
                         Caddy (TLS + routing)
                        /                      \
            PORTAL_HOSTNAME                  :443 wildcard
                /       \                        |
         Portal(3000)  Backend(/api)    Storefront Router(3100)
                        /      \              /           \
                  /api/admin  /api/storefront    B2C(3001)  B2B(3002)
                       \       /
                    Shared Domain Services
                           |
                      Prisma + PostgreSQL
                           |
                    Redis (sessions, cache, queues)
                           |
                    BullMQ (async jobs)
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **CartModule** (storefront) | Cart CRUD, line item management, cart-level discounts, price resolution | PricingService, InventoryService, ProductService |
| **CheckoutModule** (storefront) | Checkout session orchestration, address collection, shipping method selection, payment initiation | CartService, OrderService, PaymentService, InventoryService |
| **OrderModule** (storefront + admin) | Order creation from checkout, order history (storefront); order lifecycle, fulfillment, returns (admin) | PaymentService, InventoryService, NotificationService |
| **PaymentModule** (shared) | Provider-agnostic payment abstraction, webhook handling, refund orchestration | OrderService; external payment provider |
| **PricingModule** (shared, exists partially) | Price resolution: base price -> customer group price -> sale price -> contract price | PriceList (existing), CustomerGroup (existing) |
| **QuoteModule** (storefront B2B + admin) | Quote request/negotiation lifecycle, quote-to-order conversion | CartService, PricingService, OrderService |
| **CatalogModule** (storefront) | Product browsing, search, filtering, catalog restrictions per org | ProductService (existing), CategoryService (existing) |
| **CustomerAccountModule** (storefront) | Address book, order history, saved carts, account settings | StorefrontAuthService (existing), OrderService |
| **B2BAccountModule** (storefront B2B) | Org registration, member management, approval workflows, spending limits | OrganizationService (existing), CustomerService (existing) |
| **NotificationModule** (shared) | Transactional emails/notifications for orders, quotes, account events | BullMQ queues |
| **InventoryReservationService** (within existing inventory) | Soft reservation on cart/checkout, hard reservation on order placement, release on cancellation | StockLevel (existing), StockMovement (existing) |

### API Surface Split

The backend exposes two distinct API prefixes, each with its own auth strategy:

```
/api/admin/*          -> JwtAuthGuard (admin User entity, existing)
/api/storefront/*     -> StorefrontJwtAuthGuard (Customer entity, existing)
```

**Storefront API** receives store context from the router's injected headers (`x-store-id`, `x-store-slug`, `x-business-model`). Every storefront controller must extract and validate these headers. Use a `@StoreContext()` param decorator and a `StoreContextGuard` to standardize this.

**Admin API** continues the existing pattern where store selection is explicit (admin manages multiple stores).

## Data Flow

### Cart Flow (B2C)

```
1. Customer adds item -> POST /api/storefront/cart/items
2. StorefrontJwtAuthGuard authenticates (or anonymous cart via session)
3. StoreContextGuard extracts x-store-id
4. CartService.addItem():
   a. Validates product exists and is visible in store (ProductStore)
   b. Resolves price via PricingService.resolvePrice(variantId, storeId, customerGroupIds)
   c. Checks inventory availability via InventoryService.checkAvailability(variantId, storeId)
   d. Creates/updates CartItem with resolved price snapshot
5. Returns updated cart with line totals and cart total
```

### Price Resolution Flow

```
PricingService.resolvePrice(variantId, storeId, customerGroupIds?, orgId?):
  1. Find BASE price list for store + currency -> get variant price
  2. Find SALE price lists (active, valid date range, higher priority) -> override if lower
  3. If customerGroupIds provided:
     a. Find CUSTOM price lists linked to those groups -> override if applicable
  4. If orgId provided (B2B):
     a. Find org's customer group memberships
     b. Find CUSTOM price lists for org groups (contract pricing)
  5. Return: { price, compareAtPrice, priceListId, origin }
```

### Checkout-to-Order Flow

```
1. Customer initiates checkout -> POST /api/storefront/checkout
2. CheckoutService creates CheckoutSession from cart snapshot:
   a. Locks cart (prevents modification during checkout)
   b. Re-validates all prices (prices may have changed since cart creation)
   c. Re-checks inventory availability
3. Customer provides shipping address -> PATCH /api/storefront/checkout/:id/address
4. Customer selects shipping method -> PATCH /api/storefront/checkout/:id/shipping
5. Customer initiates payment -> POST /api/storefront/checkout/:id/pay
   a. PaymentService.createPaymentIntent(amount, currency, provider)
   b. Returns client-side token/redirect for payment UI
6. Payment webhook -> POST /api/storefront/payments/webhook
   a. PaymentService verifies webhook signature
   b. On success: CheckoutService.complete(checkoutId)
      i.   OrderService.createFromCheckout(checkout) -> Order with OrderItems
      ii.  InventoryService.reserveStock(items) -> StockMovement (RESERVED)
      iii. CartService.clear(cartId)
      iv.  NotificationService.sendOrderConfirmation(order)
   c. On failure: CheckoutService.fail(checkoutId), release any holds
```

### B2B Quote Flow

```
1. Buyer creates quote request -> POST /api/storefront/quotes
   a. Attaches cart items or custom line items
   b. Sets requested quantities, notes
2. Admin reviews in portal -> GET /api/admin/quotes
3. Admin adjusts prices/terms -> PATCH /api/admin/quotes/:id
   a. Sets custom unit prices, payment terms (NET_30, NET_60)
   b. Sets expiration date
4. Customer reviews quote -> GET /api/storefront/quotes/:id
5. Customer accepts -> POST /api/storefront/quotes/:id/accept
   a. QuoteService.convertToOrder(quote):
      i.   Creates Order with quoted prices (not resolved prices)
      ii.  Sets payment terms on Order
      iii. For NET terms: no immediate payment, order enters APPROVED status
6. Admin ships -> order lifecycle continues as normal
```

### B2B Approval Workflow

```
1. Member creates cart and initiates checkout
2. B2BAccountService.checkApprovalRequired(member, orderTotal):
   a. Check member's spending limit
   b. Check org's approval rules
3. If approval required:
   a. Create ApprovalRequest(order, requester, approverMemberId)
   b. Notify approver(s) via NotificationService
   c. Order enters PENDING_APPROVAL status
4. Approver reviews -> PATCH /api/storefront/approvals/:id (approve/reject)
5. On approval: order proceeds to payment/fulfillment
```

### Order Lifecycle (Admin)

```
Order States: PENDING_PAYMENT -> PAID -> PROCESSING -> PARTIALLY_SHIPPED -> SHIPPED -> DELIVERED -> COMPLETED
                                                    \-> CANCELLED (from PAID or PROCESSING)
                                                    \-> REFUND_REQUESTED -> REFUNDED (from DELIVERED/COMPLETED)

B2B additions: PENDING_APPROVAL -> APPROVED -> PROCESSING (for org approval flows)
               INVOICED (for NET payment terms, no upfront payment)
```

## Patterns to Follow

### Pattern 1: Shared Domain Service, Split Controllers

Domain logic lives in shared services. Admin and storefront controllers are thin wrappers with different auth guards and different response shapes.

```
apps/backend/src/app/
  shared/                          # NEW: shared domain services
    cart/
      cart.service.ts              # Core cart logic
      cart.module.ts
    orders/
      order.service.ts             # Core order logic
      order.module.ts
    payments/
      payment.service.ts           # Provider-agnostic payment
      payment-provider.interface.ts
      providers/
        stripe.provider.ts         # Future: concrete provider
      payment.module.ts
    pricing/
      pricing.service.ts           # Price resolution engine
      pricing.module.ts
    notifications/
      notification.service.ts
      notification.module.ts

  admin/
    orders/
      orders.controller.ts         # Admin order management
      orders.module.ts
    quotes/
      quotes.controller.ts         # Admin quote management
      quotes.module.ts

  storefront/
    cart/
      cart.controller.ts           # Storefront cart API
      cart.module.ts
    checkout/
      checkout.controller.ts       # Storefront checkout API
      checkout.module.ts
    catalog/
      catalog.controller.ts        # Product browsing API
      catalog.module.ts
    orders/
      orders.controller.ts         # Customer order history
      orders.module.ts
    quotes/
      quotes.controller.ts         # B2B quote requests
      quotes.module.ts
    account/
      account.controller.ts        # Customer account
      account.module.ts
    b2b/
      b2b.controller.ts            # B2B org management
      b2b.module.ts
```

**Why:** The existing codebase separates `admin/` from `storefront/` at the module level. Commerce needs shared logic (an order is an order regardless of who views it). Placing core services in `shared/` avoids duplication while preserving the admin/storefront API split.

### Pattern 2: Store Context Decorator

Every storefront endpoint needs store scoping. Standardize with a decorator.

```typescript
// apps/backend/src/app/storefront/decorators/store-context.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface StoreContext {
  storeId: string;
  storeSlug: string;
  businessModel: 'B2C' | 'B2B';
}

export const Store = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): StoreContext => {
    const request = ctx.switchToHttp().getRequest();
    return {
      storeId: request.headers['x-store-id'],
      storeSlug: request.headers['x-store-slug'],
      businessModel: request.headers['x-business-model'] as 'B2C' | 'B2B',
    };
  },
);
```

**Why:** The storefront router already injects these headers. A typed decorator ensures every controller gets validated store context without manual header parsing.

### Pattern 3: Payment Provider Abstraction

Payment must be provider-agnostic per the project constraints.

```typescript
// apps/backend/src/app/shared/payments/payment-provider.interface.ts
export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'cancelled';
  clientSecret?: string;  // For client-side confirmation
  redirectUrl?: string;   // For redirect-based flows
  metadata: Record<string, string>;
}

export interface PaymentProvider {
  createIntent(params: CreateIntentParams): Promise<PaymentIntent>;
  confirmIntent(intentId: string): Promise<PaymentIntent>;
  cancelIntent(intentId: string): Promise<PaymentIntent>;
  createRefund(intentId: string, amount?: number): Promise<RefundResult>;
  verifyWebhook(payload: Buffer, signature: string): boolean;
}
```

**Why:** The project explicitly defers payment provider selection. Building against an interface means the first provider implementation (likely Stripe or Iyzico given TRY currency support) slots in without touching order/checkout logic.

### Pattern 4: Cart as Server-Side Entity

Cart lives in the database, not client-side state. Enables:
- Anonymous-to-authenticated cart merge
- Price snapshot integrity
- B2B approval workflows (cart must persist for approver review)
- Abandoned cart recovery (future)

```typescript
// Prisma schema addition (cart.prisma)
model Cart {
  id        String   @id @default(cuid())
  storeId   String
  store     Store    @relation(...)

  customerId String?
  customer   Customer? @relation(...)

  // Anonymous carts use session token
  sessionToken String?

  status    CartStatus @default(ACTIVE) // ACTIVE, CHECKOUT, COMPLETED, ABANDONED
  currency  CurrencyCode

  items     CartItem[]

  expiresAt DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([storeId, customerId])
  @@index([sessionToken])
  @@index([status])
}

model CartItem {
  id     String @id @default(cuid())
  cartId String
  cart   Cart   @relation(...)

  productVariantId String
  productVariant   ProductVariant @relation(...)

  quantity Int

  // Price snapshot at time of add (re-validated at checkout)
  unitPrice      Decimal
  priceListId    String?
  currencyCode   CurrencyCode

  metadata Json? // B2B: custom notes, requested delivery date

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([cartId, productVariantId])
  @@index([cartId])
  @@index([productVariantId])
}
```

### Pattern 5: Order as Immutable Ledger

Orders capture a point-in-time snapshot. Never reference live product/price data for display -- store denormalized copies.

```typescript
model Order {
  id          String      @id @default(cuid())
  orderNumber String      @unique  // Human-readable: ORD-20260309-XXXX
  storeId     String

  // Buyer context
  customerId     String
  organizationId String?  // B2B: which org placed the order

  status      OrderStatus
  paymentStatus PaymentStatus

  // Denormalized totals
  subtotal    Decimal
  taxTotal    Decimal
  shippingTotal Decimal
  discountTotal Decimal
  grandTotal  Decimal
  currency    CurrencyCode

  // B2B specific
  paymentTerms  PaymentTerms?  // NET_30, NET_60, PREPAID
  dueDate       DateTime?      // For NET terms
  poNumber      String?        // Customer's purchase order number

  // Addresses (snapshot, not reference)
  shippingAddress Json
  billingAddress  Json

  items       OrderItem[]
  payments    OrderPayment[]
  fulfillments OrderFulfillment[]

  placedAt    DateTime
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model OrderItem {
  id      String @id @default(cuid())
  orderId String
  order   Order  @relation(...)

  productVariantId String  // Reference for linking, but display uses snapshots below

  // Snapshots (immutable after order creation)
  sku           String
  productName   String
  variantName   String
  unitPrice     Decimal
  quantity      Int
  lineTotal     Decimal

  // Fulfillment tracking
  fulfilledQty  Int @default(0)
  returnedQty   Int @default(0)
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Monolithic Checkout Service
**What:** Putting cart validation, price resolution, inventory check, payment, and order creation all in one service method.
**Why bad:** Untestable, unreliable (partial failure leaves inconsistent state), impossible to extend for B2B flows.
**Instead:** Checkout orchestrates discrete services. Each service has a single responsibility. Use database transactions for atomicity at the order creation boundary.

### Anti-Pattern 2: Client-Side Price Calculation
**What:** Computing totals, discounts, or tax in the Next.js storefront.
**Why bad:** Prices can be manipulated. B2B contract pricing requires server-side resolution. Multi-currency rounding must be consistent.
**Instead:** All price calculation happens server-side. Cart items store price snapshots. Checkout re-validates before order creation.

### Anti-Pattern 3: Shared Cart/Order Module Between Admin and Storefront
**What:** One NestJS module serving both admin and storefront controllers for orders.
**Why bad:** Auth guards differ, response shapes differ, storefront needs store-scoping while admin crosses stores. Mixing them creates guard complexity.
**Instead:** Shared service in `shared/orders/`, separate controller modules in `admin/orders/` and `storefront/orders/`. Both import the shared service module.

### Anti-Pattern 4: Direct Inventory Mutation from Checkout
**What:** Directly decrementing StockLevel.quantity during checkout.
**Why bad:** Race conditions under concurrent checkouts. No audit trail. Violates the existing StockMovement pattern.
**Instead:** Use the existing StockMovement system. Cart checkout creates a RESERVED movement. Fulfillment creates a GOODS_ISSUE movement. This preserves the audit trail and uses the existing `reservedQty`/`availableQty` fields on StockLevel.

### Anti-Pattern 5: Business Model Branching in Controllers
**What:** `if (businessModel === 'B2B') { ... }` scattered through storefront controllers.
**Why bad:** B2B has fundamentally different flows (approvals, quotes, org context). Conditional branches grow unmanageable.
**Instead:** B2B-specific endpoints live in `storefront/b2b/` and `storefront/quotes/`. Shared logic (cart, catalog) handles B2B through service-level composition (e.g., PricingService accepts optional orgId).

## Scalability Considerations

| Concern | At 100 users | At 10K users | At 1M users |
|---------|-------------|-------------|-------------|
| Cart storage | PostgreSQL, no issues | PostgreSQL, add Redis cache for hot carts | Redis as primary cart store, PostgreSQL for persistence |
| Price resolution | Direct DB queries per request | Cache base price lists in Redis, invalidate on update | Pre-computed price cache per variant+group |
| Inventory checks | Direct StockLevel query | Read replica for availability checks | Eventually-consistent availability with reservation queue |
| Order writes | Direct inserts | No issues (orders are append-only) | Partition by storeId or date range |
| Search/filtering | PostgreSQL ILIKE/GIN | PostgreSQL full-text search with tsvector | Consider Meilisearch/Typesense (out of scope) |

For the current self-hosted scope, PostgreSQL handles all concerns adequately. Redis caching for price lists and cart sessions is the first optimization when needed.

## Suggested Build Order

Build order is driven by data dependencies. Each layer depends on the one before it.

```
Phase 1: Storefront Catalog + Customer Auth
  ├── CatalogModule (reads existing products/categories, no new schema)
  ├── CustomerAccountModule (extends existing StorefrontAuthModule)
  └── StoreContextGuard + @Store() decorator (foundation for all storefront APIs)
  Dependencies: None (reads existing data)

Phase 2: Cart + Pricing
  ├── Cart schema (new: Cart, CartItem)
  ├── CartModule (storefront)
  ├── PricingService (reads existing PriceList/PriceListPrice)
  └── Inventory availability check (reads existing StockLevel)
  Dependencies: Phase 1 (needs catalog to browse, auth to own cart)

Phase 3: Checkout + Orders + Payment
  ├── Order schema (new: Order, OrderItem, OrderPayment, OrderFulfillment)
  ├── CheckoutModule (storefront)
  ├── OrderModule (storefront: placement + history; admin: lifecycle)
  ├── PaymentModule with provider interface (no concrete provider yet)
  └── Inventory reservation integration (uses existing StockMovement)
  Dependencies: Phase 2 (checkout converts cart to order)

Phase 4: B2B Commerce
  ├── Quote schema (new: Quote, QuoteItem)
  ├── QuoteModule (storefront + admin)
  ├── B2BAccountModule (org registration, member roles, extends existing Organization)
  ├── Approval workflow (new: ApprovalRequest)
  ├── Contract pricing (connects existing PriceList CUSTOM type to orgs)
  └── Restricted catalogs (org-scoped product visibility)
  Dependencies: Phase 3 (quotes convert to orders, approvals gate orders)

Phase 5: Admin Order Management + Fulfillment
  ├── Admin order dashboard (list, detail, status transitions)
  ├── Fulfillment flow (pick, pack, ship with StockMovement GOODS_ISSUE)
  ├── Returns and refunds (return request -> refund via PaymentService)
  └── Analytics/reporting (order metrics, revenue)
  Dependencies: Phase 3-4 (needs orders to exist)

Phase 6: Payment Provider Integration
  ├── Concrete payment provider implementation (Stripe/Iyzico)
  ├── Webhook handling
  ├── B2B invoice/NET terms payment tracking
  └── End-to-end payment testing
  Dependencies: Phase 3 (implements the PaymentProvider interface)
```

**Phase ordering rationale:**
- Catalog before cart: customers need to browse before they can buy
- Cart before checkout: checkout consumes cart data
- B2C checkout before B2B: B2B extends B2C flows with approvals/quotes, not replaces them
- Payment provider last: the abstraction layer lets all other work proceed with a mock/manual provider
- Admin order management can parallel Phase 4 since it only needs orders to exist

## New Prisma Schema Files Needed

| File | Models | Phase |
|------|--------|-------|
| `cart.prisma` | Cart, CartItem | Phase 2 |
| `order.prisma` | Order, OrderItem, OrderPayment, OrderFulfillment, OrderStatusHistory | Phase 3 |
| `checkout.prisma` | CheckoutSession | Phase 3 |
| `quote.prisma` | Quote, QuoteItem, QuoteStatusHistory | Phase 4 |
| `approval.prisma` | ApprovalRequest, ApprovalRule | Phase 4 |
| `address.prisma` | CustomerAddress (reusable address book) | Phase 1 |
| `notification.prisma` | NotificationTemplate, NotificationLog | Phase 5 |

**Existing schemas that need relation additions (not rewrites):**
- `store.prisma` -> add Cart[], Order[], Quote[] relations
- `customer.prisma` -> add Cart[], Order[], Address[], Quote[] relations
- `organization.prisma` -> add Order[], Quote[], ApprovalRule[] relations
- `product.prisma` (ProductVariant) -> add CartItem[], OrderItem[] relations
- `inventory.prisma` (StockMovement) -> add referenceType for ORDER linkage (already has referenceType/referenceId fields)

## Sources

- Codebase analysis: existing Prisma schemas, NestJS module structure, storefront router implementation
- Architecture patterns derived from existing codebase conventions (module pattern, service pattern, auth guard pattern)
- Commerce domain patterns based on established e-commerce architecture (Medusa, Saleor, Shopify patterns) -- HIGH confidence as these are well-established patterns

---

*Architecture analysis: 2026-03-09*
