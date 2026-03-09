# Feature Landscape

**Domain:** Multi-tenant B2C + B2B Commerce Platform (self-hosted)
**Researched:** 2026-03-09
**Overall confidence:** HIGH (established domain, stable feature expectations)

---

## Table Stakes

Features users expect. Missing = product feels incomplete.

### B2C Storefront

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Product catalog browsing | Core purpose of a storefront | Medium | Needs search, filtering, sorting, pagination. Existing product model has translations, variants, images. |
| Product detail page (PDP) | Users must see what they buy | Medium | Variant selector, image gallery, price display, stock availability indicator. |
| Shopping cart | Fundamental commerce flow | Medium | Persistent cart (DB-backed for logged-in, cookie/localStorage for guests). Cart must handle variant-level pricing, quantity validation against stock. |
| Guest checkout | 30-50% of B2C buyers abandon if forced to register | High | Needs order placement without account. Collect email for order tracking. Convert to account post-purchase optionally. |
| Registered checkout | Returning customers expect saved info | Medium | Address book, saved payment methods (future), order history pre-fill. |
| Customer authentication | Account management is baseline | Low | Already have Customer model with sessions, OAuth, 2FA. Build storefront login/register UI. |
| Order placement | Core transaction | High | Address collection, shipping method selection (manual initially), payment capture (provider-agnostic), order confirmation, email notification. |
| Order history & tracking | Customers expect to see past orders | Low | List orders, show status timeline, link to details. |
| Search | Users need to find products | Medium | Full-text search on product name/description. Start with PostgreSQL full-text search (tsvector). Elasticsearch/Meilisearch is a differentiator, not table stakes. |
| Category navigation | Standard product discovery pattern | Low | Category tree already exists. Build storefront nav from it. |
| Responsive design | Mobile traffic is 60%+ of ecommerce | Medium | Mobile-first storefront. Not a native app (out of scope), but must be fully responsive. |
| Basic SEO | Products must be discoverable via search engines | Medium | Meta tags, structured data (JSON-LD Product schema), sitemap.xml, canonical URLs. Next.js App Router handles SSR/SSG well. |
| Email notifications | Transactional emails are expected | Medium | Order confirmation, shipping notification, password reset. Use BullMQ for async email jobs. |

### B2B Storefront

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Company account registration | B2B buyers represent organizations, not individuals | Medium | Organization registration with approval flow. Admin must approve new org accounts before they can purchase. |
| Multiple buyers per company | Companies have procurement teams | Low | Organization model already supports members with roles (OWNER, MANAGER, MEMBER). Build UI for org admin to invite/manage buyers. |
| Role-based purchasing permissions | Not every employee should be able to buy | Medium | OWNER: full access. MANAGER: approve orders, manage members. MEMBER: place orders (subject to approval). Map to OrgMemberRole enum. |
| Purchase approval workflows | Companies need internal controls on spend | High | Configurable approval rules: by order total threshold, by buyer role, by product category. Multi-level approval using the member hierarchy (closure table already exists). |
| Contract/negotiated pricing | B2B pricing is never list price | Medium | Price lists already support customer group linking. Organizations join customer groups. Display negotiated prices on storefront. Show "your price" vs "list price." |
| Payment terms (net-30, net-60) | B2B rarely pays at checkout | High | Credit line management per organization, payment term selection at checkout, invoice generation, payment tracking. This is a fundamental B2B differentiator from B2C. |
| Quote request (RFQ) workflow | Large/custom orders need negotiation | High | Buyer submits quote request with line items and quantities. Sales rep reviews, adjusts pricing, sends quote. Buyer accepts/rejects/counters. Accepted quote converts to order. |
| Order history per organization | Procurement teams need org-wide visibility | Low | All orders for the org, filterable by buyer, date, status. Managers see all; members see own. |
| Reorder / repeat ordering | B2B purchases are repetitive | Low | "Reorder" button on past orders. Pre-populate cart from previous order. |
| Bulk/quick order entry | B2B buyers know exactly what they need | Medium | SKU-based quick order form: paste SKU + quantity list, CSV upload, or searchable table with quantity inputs. No browsing needed. |
| Restricted catalogs | Not all products visible to all orgs | Medium | Customer group-based catalog visibility. ProductStore.isVisible + customer group membership determines what an org can see and purchase. |

### Admin Commerce

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Order management dashboard | Admin must process orders | Medium | Order list with status filters, search, bulk actions. View order details, customer info, line items, payment status. |
| Order lifecycle management | Orders go through stages | High | Status machine: Pending -> Confirmed -> Processing -> Shipped -> Delivered -> Completed. Also: Cancelled, Refund Requested, Refunded, Partially Refunded. |
| Manual order creation | Sales reps create orders on behalf of customers | Medium | Especially important for B2B: phone/email orders, quote-to-order conversion. |
| Inventory visibility | Admin must know stock levels | Low | Already have StockLevel model. Build admin UI to view stock per variant per warehouse. |
| Price list management | Admin controls pricing | Low | PriceList model exists. Build admin CRUD UI with customer group assignment. |
| Basic reporting | Store owners need business insights | Medium | Revenue over time, order count, top products, top customers. Start with simple aggregate queries. |
| Customer/org management | Admin manages accounts | Low | Existing customer management + organization management views. Extend with B2B-specific views (org hierarchy, member management, credit lines). |
| Tax configuration | Commerce requires tax handling | Medium | Tax rate configuration per region/product type. Applied at checkout. Start with simple percentage-based tax rules. |
| Shipping configuration | Checkout needs shipping options | Medium | Manual shipping methods with flat rates, free shipping thresholds, weight-based rules. No carrier API integration (out of scope). |

---

## Differentiators

Features that set product apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Advanced search (Meilisearch/Elasticsearch) | Sub-50ms typo-tolerant, faceted search | High | Significant value but PostgreSQL full-text is sufficient for launch. Add as enhancement. |
| Wishlists / saved lists | B2C convenience, B2B procurement planning | Low | Simple product-list association. Low effort, nice UX. |
| Product comparison | Helps buyers evaluate options | Low | Side-by-side attribute comparison for products in the same category. |
| Customer-specific catalogs (per org) | Beyond group-based: truly custom product assortments per organization | Medium | Useful for distributors with exclusive products per customer. Goes beyond restricted catalogs. |
| Tiered/volume pricing | "Buy more, pay less" -- common in B2B | Medium | Price breaks at quantity thresholds. Can be implemented as an extension to PriceListPrice with quantity ranges. |
| Budget management for B2B buyers | Org admins set spending limits per buyer/department per period | High | Requires budget tracking, period resets, enforcement at checkout. Very valuable for enterprise B2B. |
| Multi-address / split shipments | Ship different line items to different addresses | High | Complex order fulfillment but important for B2B (ship to multiple branch offices). Defer to later phase. |
| Saved carts / draft orders | B2B buyers build orders over days/weeks | Low | Persist cart state server-side with named carts. Simple but valuable for B2B workflow. |
| Product reviews & ratings | Social proof drives B2C conversion | Medium | Review moderation, average rating calculation, display on PDP. |
| Discount codes / coupons | Promotional tool for marketing | Medium | Code-based discounts with rules (percentage/fixed, minimum order, date range, usage limits, customer group restrictions). |
| Promotions engine | Automatic discounts without codes | High | "Buy 2 get 1 free", category-wide sales, bundle pricing. Requires a rule evaluation engine (RuleTree exists). |
| Abandoned cart recovery | Recover lost revenue | Medium | Track incomplete checkouts, send reminder emails. Requires email automation via BullMQ. |
| Multi-currency storefront | Display prices in buyer's currency | Medium | CurrencyCode enum already exists (TRY, USD, EUR, GBP). PriceLists are currency-scoped. Need real-time conversion or pre-set prices per currency. |
| Order export / ERP integration | B2B customers feed orders into their systems | Medium | Export orders as CSV/XML. API endpoints for order data. Foundation for ERP sync. |
| Admin audit trail | Track who changed what and when | Low | AuditLog model already exists. Surface in admin UI for order/product/pricing changes. |
| Webhook notifications | External system integration | Medium | Fire webhooks on order events (placed, shipped, completed). Enables third-party integrations. |
| Purchase order (PO) number support | B2B buyers reference internal PO numbers | Low | Simple text field on order, searchable in admin. Trivial to implement, expected by enterprise buyers. |

---

## Anti-Features

Features to deliberately NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Marketplace / multi-vendor | Fundamentally different architecture (vendor onboarding, commission splitting, per-vendor fulfillment). Out of scope per PROJECT.md. | Single-vendor stores only. Multi-store ≠ marketplace. |
| Subscription / recurring billing | Requires recurring payment orchestration, dunning management, plan management. Entirely different product domain. | Defer completely. Build one-time purchase flow well first. |
| Native mobile apps | Expensive to maintain two platforms. Web-first strategy. | Responsive web storefront, PWA-ready (service worker, manifest). |
| Shipping carrier API integration | Third-party API dependencies, rate negotiation complexity, label printing. | Manual shipping methods with flat/weight-based rates. Add carrier APIs as a future integration. |
| Built-in email editor / marketing automation | Competes with Mailchimp/Klaviyo. Not core commerce value. | Transactional emails only (order confirmation, shipping, password reset). Integrate with external marketing tools via webhooks. |
| AI-powered product recommendations | ML infrastructure is overkill for self-hosted platform at this stage. | "Related products" via manual curation or same-category association. |
| Chat / live support widget | Better handled by dedicated tools (Intercom, Crisp, Tawk). | Provide "Contact Us" page with form. Integrate chat widget via script injection if needed. |
| Multi-language storefront content (CMS) | Full CMS is a separate product. | Product translations exist (ProductTranslation). Static pages can be simple markdown or hardcoded. No page builder. |
| Social login for B2B storefront | B2B buyers use corporate emails, not social accounts. Social login adds confusion. | Email + password only for B2B. Social login for B2C only. |
| Real-time inventory sync with external systems | Requires complex integration middleware. | Manual stock management via admin. Batch import via CSV if needed. ERP sync is a future integration concern. |

---

## Feature Dependencies

```
Customer Authentication -> Shopping Cart (persistent, logged-in)
Customer Authentication -> Order Placement
Customer Authentication -> Order History
Shopping Cart -> Checkout Flow -> Order Placement
Product Catalog -> Product Detail Page -> Add to Cart
Product Catalog -> Search
Product Catalog -> Category Navigation

Organization Registration -> Multiple Buyers per Org
Organization Registration -> Role-Based Permissions
Role-Based Permissions -> Purchase Approval Workflows
Organization Registration -> Contract Pricing (via Customer Groups)
Organization Registration -> Restricted Catalogs (via Customer Groups)
Contract Pricing -> Quote Workflow (quotes reference negotiated prices)
Quote Workflow -> Order Placement (accepted quote -> order)
Order Placement -> Payment Terms (B2B: invoice, net-30)
Order Placement -> Order History

Order Placement -> Order Lifecycle (admin side)
Order Lifecycle -> Fulfillment -> Shipping Notifications
Inventory -> Order Placement (stock validation)
Inventory -> Order Lifecycle (stock reservation/deduction)
Price Lists -> Contract Pricing -> Storefront Price Display
Tax Configuration -> Checkout Total Calculation
Shipping Configuration -> Checkout Flow

Email Notifications -> Order Placement (confirmation)
Email Notifications -> Shipping Notifications
Email Notifications -> Approval Workflow Notifications
```

### Critical Path
```
1. Customer Auth (B2C) -> Cart -> Checkout -> Order Placement -> Order Lifecycle (Admin)
2. Org Registration (B2B) -> Buyer Management -> Approval Workflows -> B2B Checkout
3. Price Lists (Admin) -> Contract Pricing (B2B Storefront)
```

---

## MVP Recommendation

### Phase 1: B2C Storefront Core
Prioritize these to have a functional B2C store:

1. **Customer authentication** (storefront login/register) -- Low complexity, unlocks everything
2. **Product catalog browsing** (listing, filtering, category nav) -- Core storefront purpose
3. **Product detail page** (variants, pricing, images, stock indicator)
4. **Shopping cart** (add/remove/update, persistent for logged-in users)
5. **Checkout flow** (address, shipping method, payment placeholder, order placement)
6. **Order history** (customer-facing order list and detail)
7. **Admin order management** (order list, status management, basic lifecycle)
8. **Email notifications** (order confirmation at minimum)
9. **Tax and shipping configuration** (admin-side, required for checkout math)

### Phase 2: B2B Storefront Core
Build on B2C foundation with B2B-specific flows:

1. **Company account registration + admin approval** -- Gate for all B2B features
2. **Buyer management** (invite members, assign roles) -- Org admin self-service
3. **Contract pricing display** (show org-specific prices via price list + customer group) -- Already have data model
4. **Restricted catalogs** (filter product visibility by org's customer group)
5. **Purchase order number support** -- Trivial, expected by B2B buyers
6. **Bulk/quick order entry** -- SKU-based ordering, core B2B UX
7. **Reorder from history** -- Low effort, high value for B2B

### Phase 3: B2B Advanced + Commerce Enhancement
1. **Purchase approval workflows** -- High complexity, high value
2. **Quote request (RFQ) workflow** -- High complexity, core B2B differentiator
3. **Payment terms (net-30, net-60)** -- Requires credit line management, invoice generation
4. **Discount codes / coupons** -- Marketing tool for B2C
5. **Advanced reporting** -- Revenue analytics, customer insights

**Defer completely:**
- Advanced search (Meilisearch) -- PostgreSQL full-text is sufficient initially
- Promotions engine -- Complex, not table stakes
- Multi-currency storefront -- Price lists are already currency-scoped; UI can come later
- Budget management -- Enterprise feature, not needed for launch
- Abandoned cart recovery -- Nice to have, not critical

---

## Existing Data Model Advantages

The codebase already has sophisticated foundations that reduce implementation effort:

| Existing Model | Enables Feature | Effort Reduction |
|---------------|-----------------|-----------------|
| Organization + OrganizationMember + OrgMemberClosure | B2B hierarchy, buyer management, approval chains | High -- closure table for tree queries already implemented |
| PriceList + PriceListPrice + PriceListCustomerGroup | Contract pricing, tiered pricing, sale pricing | High -- full inheritance and customer group linking exists |
| CustomerGroup + CustomerGroupMember (supports org membership) | Restricted catalogs, group pricing, rule-based segmentation | High -- both manual and rule-based groups exist |
| StockLevel + StockMovement + Batch + SerialNumber | Inventory management, stock validation at checkout | Very High -- SAP-grade inventory model exists |
| Warehouse + Zone + Bin | Multi-warehouse fulfillment, stock location | Very High -- full warehouse hierarchy exists |
| ProductTranslation + ProductVariant + ProductStore | Multi-language catalog, variant-level purchasing, multi-store visibility | High |
| Customer + CustomerSession + CustomerOAuthAccount | Storefront auth, session management | High -- full auth infrastructure exists |
| Store.businessModel (B2C/B2B enum) | Store-level B2C/B2B differentiation | Medium -- routing logic can branch on this |
| RuleTree (rule engine) | Dynamic customer groups, future promotions engine | Medium |

**Key insight:** The hardest data modeling work is done. The remaining effort is primarily:
1. **Storefront UI** -- Next.js pages consuming existing backend data
2. **Checkout/order flow** -- New Order/OrderLine/Payment models + business logic
3. **B2B workflow logic** -- Approval state machine, quote state machine
4. **Admin UI extensions** -- Order management, reporting views

---

## Sources

- Domain knowledge based on established B2B/B2C commerce patterns (Shopify, Magento, Saleor, Medusa, OroCommerce, BigCommerce B2B)
- Existing Helix codebase analysis (Prisma schemas, enum definitions, model relationships)
- Confidence: HIGH -- commerce feature landscape is mature and well-documented across the industry. The table stakes vs differentiator categorization is consistent across all major platforms.

**Note:** Web search was unavailable during research. All findings are based on training data covering major commerce platforms through early 2025. The B2C/B2B commerce feature landscape is highly stable -- these categorizations are unlikely to have shifted.
