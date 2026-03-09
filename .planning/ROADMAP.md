# Roadmap: Helix Commerce Platform

## Overview

Helix delivers a complete B2C and B2B commerce platform in five phases: storefront catalog and customer accounts first, then cart/checkout/orders to enable purchasing, followed by admin commerce operations for store management, then B2B organization and pricing foundations, and finally B2B ordering workflows (approvals, quotes, payment terms, bulk ordering). Each phase delivers a coherent, end-to-end capability that builds on the previous.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Storefront Foundation + Catalog** - Tenant-scoped storefront with product browsing, search, customer auth, and responsive design
- [ ] **Phase 2: Cart, Checkout + Orders** - Complete B2C purchase flow from cart to order confirmation with payment abstraction
- [ ] **Phase 3: Admin Commerce Operations** - Order lifecycle management, tax/shipping configuration, price lists, and reporting
- [ ] **Phase 4: B2B Organizations + Pricing** - Company accounts, multi-buyer roles, contract pricing, and restricted catalogs
- [ ] **Phase 5: B2B Ordering Workflows** - Purchase approvals, quote negotiation, payment terms, bulk ordering, and reordering

## Phase Details

### Phase 1: Storefront Foundation + Catalog
**Goal**: Customers can browse, search, and discover products on a responsive, SEO-ready storefront with account management
**Depends on**: Nothing (first phase)
**Requirements**: INFR-01, BCAT-01, BCAT-02, BCAT-03, BCAT-04, BCAT-05, BCAT-06, CUST-01, CUST-02, CUST-03
**Success Criteria** (what must be TRUE):
  1. Customer can browse product listings with filters, sorting, and pagination, and navigate by category tree
  2. Customer can view a product detail page with variants, images, pricing, and stock status
  3. Customer can search products by name/description and get relevant results
  4. Customer can register, log in, view order history, and manage their profile and addresses
  5. Storefront renders responsively on mobile and includes SEO meta tags with structured data
**Plans**: TBD

Plans:
- [ ] 01-01: TBD
- [ ] 01-02: TBD
- [ ] 01-03: TBD

### Phase 2: Cart, Checkout + Orders
**Goal**: Customers can add products to a cart, complete checkout with address and shipping selection, and receive order confirmation
**Depends on**: Phase 1
**Requirements**: INFR-02, INFR-03, CART-01, CART-02, CART-03, CART-04
**Success Criteria** (what must be TRUE):
  1. Customer can add, remove, and update items in a persistent cart with correct variant-level pricing
  2. Guest customer can complete checkout without an account; registered customer checks out with saved addresses
  3. Customer receives order confirmation after placing an order with address, shipping, and payment capture
  4. All price calculations use consistent decimal precision with no floating-point errors
**Plans**: TBD

Plans:
- [ ] 02-01: TBD
- [ ] 02-02: TBD
- [ ] 02-03: TBD

### Phase 3: Admin Commerce Operations
**Goal**: Store admin can manage orders through their full lifecycle, configure tax and shipping, manage price lists, and view sales reports
**Depends on**: Phase 2
**Requirements**: AORD-01, AORD-02, AORD-03, AORD-04, ACFG-01, ACFG-02, ACFG-03, ACFG-04, ACFG-05
**Success Criteria** (what must be TRUE):
  1. Admin can view, search, filter, and bulk-act on orders; order status follows a defined state machine through its lifecycle
  2. Admin can create orders manually on behalf of customers and view inventory stock levels per variant
  3. Admin can configure tax rates by region/product type and shipping methods with flat/weight-based/free-threshold rules
  4. System sends transactional emails for order confirmation, shipping updates, and password reset
  5. Admin can view revenue-over-time, order count, top products, and top customers reports; and manage price lists with customer group assignment
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD
- [ ] 03-03: TBD

### Phase 4: B2B Organizations + Pricing
**Goal**: Businesses can register company accounts, manage buyers with role-based permissions, and see negotiated pricing with catalog restrictions
**Depends on**: Phase 1
**Requirements**: BORG-01, BORG-02, BORG-03, BPRC-01, BPRC-02, BPRC-03
**Success Criteria** (what must be TRUE):
  1. Business can register a company account that requires admin approval before purchasing is enabled
  2. Organization admin can invite members and assign roles (owner, manager, member) with enforced purchasing permissions
  3. B2B buyer sees contract/negotiated prices based on their organization's customer group and price list
  4. Product catalog is filtered by organization's customer group membership; buyer can attach a PO number to orders
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD

### Phase 5: B2B Ordering Workflows
**Goal**: B2B buyers can go through approval workflows, request and negotiate quotes, use payment terms, and place orders efficiently via bulk entry and reordering
**Depends on**: Phase 2, Phase 4
**Requirements**: BWRK-01, BWRK-02, BWRK-03, BWRK-04, BWRK-05
**Success Criteria** (what must be TRUE):
  1. Purchases above configurable thresholds require approval from authorized roles with multi-level approval chain support
  2. Buyer can submit an RFQ, sales rep can review and adjust pricing, buyer can accept/reject/counter, and accepted quotes convert to orders
  3. B2B checkout supports payment terms (net-30, net-60) with credit line management and invoice generation
  4. B2B buyer can place orders via SKU-based quick order form (paste, CSV upload, or searchable table) and reorder from previous history
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5
Note: Phase 3 and Phase 4 can potentially execute in parallel (Phase 3 depends on Phase 2; Phase 4 depends on Phase 1).

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Storefront Foundation + Catalog | 0/3 | Not started | - |
| 2. Cart, Checkout + Orders | 0/3 | Not started | - |
| 3. Admin Commerce Operations | 0/3 | Not started | - |
| 4. B2B Organizations + Pricing | 0/2 | Not started | - |
| 5. B2B Ordering Workflows | 0/2 | Not started | - |
