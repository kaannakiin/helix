# Requirements: Helix Commerce Platform

**Defined:** 2026-03-09
**Core Value:** Both B2C and B2B storefronts fully functional with distinct business flows, backed by complete admin capabilities

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### B2C Catalog & Discovery

- [ ] **BCAT-01**: Customer can browse product listings with filtering, sorting, and pagination
- [ ] **BCAT-02**: Customer can view product detail page with variant selector, image gallery, pricing, and stock availability
- [ ] **BCAT-03**: Customer can navigate products by category tree
- [ ] **BCAT-04**: Customer can search products by name and description via full-text search
- [ ] **BCAT-05**: Product pages include SEO meta tags, JSON-LD structured data, and sitemap.xml
- [ ] **BCAT-06**: Storefront is responsive and mobile-first

### B2C Cart & Checkout

- [ ] **CART-01**: Customer can add/remove/update items in a persistent shopping cart with variant-level pricing and quantity validation
- [ ] **CART-02**: Guest customer can complete checkout without creating an account (email collected for tracking)
- [ ] **CART-03**: Registered customer can checkout with saved addresses and order history pre-fill
- [ ] **CART-04**: Customer can place an order with address collection, shipping method selection, payment capture, and order confirmation email

### B2C Customer Account

- [ ] **CUST-01**: Customer can register and log in on the storefront
- [ ] **CUST-02**: Customer can view order history with status tracking and order details
- [ ] **CUST-03**: Customer can manage profile (name, email, password) and address book

### B2B Organization & Buyers

- [ ] **BORG-01**: Business can register a company account, subject to admin approval before purchasing
- [ ] **BORG-02**: Organization admin can invite members and assign roles (owner, manager, member)
- [ ] **BORG-03**: Purchasing permissions are enforced by role (owner: full access, manager: approve + manage, member: place orders subject to approval)

### B2B Pricing & Catalogs

- [ ] **BPRC-01**: Organization sees negotiated/contract prices based on their customer group and price list assignment
- [ ] **BPRC-02**: Product catalog visibility is filtered by organization's customer group membership
- [ ] **BPRC-03**: B2B buyer can attach a purchase order (PO) number to an order

### B2B Ordering & Workflows

- [ ] **BWRK-01**: Purchases above configurable thresholds require approval from authorized roles, supporting multi-level approval chains
- [ ] **BWRK-02**: Buyer can submit a quote request (RFQ) with line items; sales rep reviews, adjusts pricing, sends quote; buyer accepts/rejects/counters; accepted quote converts to order
- [ ] **BWRK-03**: B2B checkout supports payment terms (net-30, net-60) with credit line management per organization and invoice generation
- [ ] **BWRK-04**: B2B buyer can place orders via SKU-based quick order form (paste SKU + quantity, CSV upload, or searchable table)
- [ ] **BWRK-05**: B2B buyer can reorder from previous order history with one click

### Admin Order Management

- [ ] **AORD-01**: Admin can view and manage orders with status filters, search, and bulk actions
- [ ] **AORD-02**: Order lifecycle follows a state machine (pending -> confirmed -> processing -> shipped -> delivered -> completed; also cancelled, refund requested, refunded)
- [ ] **AORD-03**: Admin/sales rep can create orders manually on behalf of customers
- [ ] **AORD-04**: Admin can view inventory stock levels per variant per warehouse

### Admin Configuration & Reporting

- [ ] **ACFG-01**: Admin can configure tax rates per region and product type, applied at checkout
- [ ] **ACFG-02**: Admin can configure shipping methods with flat rates, weight-based rules, and free shipping thresholds
- [ ] **ACFG-03**: System sends transactional emails for order confirmation, shipping updates, and password reset
- [ ] **ACFG-04**: Admin can view basic reports (revenue over time, order count, top products, top customers)
- [ ] **ACFG-05**: Admin can manage price lists with customer group assignment via CRUD UI

### Commerce Infrastructure

- [ ] **INFR-01**: Tenant-scoping middleware ensures all storefront queries are isolated by storeId
- [ ] **INFR-02**: Money/decimal arithmetic uses consistent precision conventions across all price calculations
- [ ] **INFR-03**: Payment integration uses a provider-agnostic interface (provider TBD, initial mock implementation)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Search Enhancement

- **SRCH-01**: Advanced search with MeiliSearch (sub-50ms, typo-tolerant, faceted)

### B2C Engagement

- **ENGM-01**: Customer can create and manage wishlists
- **ENGM-02**: Customer can compare products side-by-side
- **ENGM-03**: Customer can leave product reviews and ratings
- **ENGM-04**: Abandoned cart recovery emails sent automatically

### B2B Advanced

- **BADV-01**: Organization admin can set spending budgets per buyer/department per period
- **BADV-02**: B2B buyer can save named draft carts for later
- **BADV-03**: Order supports multi-address / split shipments
- **BADV-04**: Customer-specific catalogs (per org, beyond group-based)
- **BADV-05**: Tiered/volume pricing (quantity-based price breaks)

### Marketing & Integration

- **MKTG-01**: Discount codes and coupons with configurable rules
- **MKTG-02**: Promotions engine (automatic discounts, bundles)
- **MKTG-03**: Multi-currency storefront display
- **MKTG-04**: Order export and ERP integration endpoints
- **MKTG-05**: Webhook notifications on order events
- **MKTG-06**: Admin audit trail UI

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Mobile apps (iOS/Android) | Web-first strategy; responsive web is sufficient |
| Marketplace / multi-vendor | Fundamentally different architecture; single-vendor stores only |
| Subscription / recurring billing | Entirely different product domain; defer completely |
| Shipping carrier API integration | Third-party API complexity; manual fulfillment sufficient |
| Built-in email marketing / automation | Compete with Mailchimp/Klaviyo; transactional emails only |
| AI product recommendations | ML infrastructure overkill for self-hosted platform |
| Chat / live support widget | Better handled by dedicated tools (Intercom, Crisp) |
| CMS / page builder | Product translations exist; no full CMS needed |
| Social login for B2B | B2B uses corporate emails; social login adds confusion |
| Real-time inventory sync with external systems | Manual stock management; batch import via CSV if needed |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| (Populated by roadmapper) | | |

**Coverage:**
- v1 requirements: 30 total
- Mapped to phases: 0
- Unmapped: 30

---
*Requirements defined: 2026-03-09*
*Last updated: 2026-03-09 after initial definition*
