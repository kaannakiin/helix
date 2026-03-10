# CLAUDE.md — Prisma Package (@org/prisma)

## Commands

```bash
npx nx prisma-generate prisma    # generate client → generated/prisma/
npx nx prisma-migrate prisma     # run migrations
npx nx seed prisma               # run base seed (currencies, locales, countries)

# Individual seeds
npx tsx src/seeds/base-seed.ts              # bootstrap data
npx tsx src/new-seeds/catalog-seed.ts       # products, variants, pricing
npx tsx src/new-seeds/customer-seed.ts      # customers
npx tsx src/new-seeds/organization-seed.ts  # org hierarchy
npx tsx src/seeds/store-seed.ts             # sample stores/domains
npx tsx src/seeds/taxonomy-seed.ts          # Google taxonomy
npx tsx src/seeds/geolocation-seed.ts       # countries/states/cities

# Bulk seed with env var
PRODUCT_SEED_COUNT=300 npx tsx src/new-seeds/catalog-seed.ts
```

## Schema Organization

Uses Prisma 7.4 **multi-file schema** (`prisma.config.ts` → `schema: 'prisma/schema'`).

```
prisma/schema/
├── base.prisma           # generator + datasource (PostgreSQL)
├── shared/
│   └── enums.prisma      # ALL enums (40+) in one file
├── catalog/              # Product ecosystem
│   ├── product.prisma    # Product, ProductTranslation, ProductStore, ProductCategory, ProductTag
│   ├── variant.prisma    # ProductVariant, ProductVariantGroup, ProductVariantValue, VariantGroup, VariantOption
│   ├── image.prisma      # Image (polymorphic ownership)
│   ├── category.prisma   # Category, CategoryTranslation
│   ├── brand.prisma      # Brand, BrandTranslation
│   ├── tag.prisma        # Tag, TagGroup (recursive)
│   ├── taxonomy.prisma   # GoogleTaxonomy
│   └── uom.prisma        # UnitOfMeasure, ProductUnitOfMeasure
├── identity/             # Auth & users
│   ├── user.prisma       # User (admin)
│   ├── customer.prisma   # Customer, CustomerOAuthAccount
│   ├── session.prisma    # UserSession, CustomerSession
│   ├── token.prisma      # VerificationToken
│   └── audit.prisma      # AuditLog, AccountEvent
├── operations/           # Business logic
│   ├── inventory.prisma  # StockLevel, StockMovement, Batch, SerialNumber
│   ├── pricing.prisma    # PriceList, PriceListPrice, PriceListCustomerGroup
│   ├── warehouse.prisma  # Warehouse, Zone, Bin
│   ├── customer-group.prisma  # CustomerGroup, CustomerGroupMember
│   ├── rule.prisma       # RuleTree, DecisionNode (rule engine)
│   └── evaluation-job.prisma  # EvaluationJob
└── platform/             # Multi-tenancy
    ├── organization.prisma    # Organization, OrganizationMember, OrgMemberClosure
    ├── store.prisma           # Store, PlatformInstallation
    ├── domain.prisma          # DomainSpace, HostBinding
    ├── currency.prisma        # Currency
    └── geolocation.prisma     # Country, State, City
```

## Model Conventions

**Standard fields on every model:**
```prisma
model Foo {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  isActive  Boolean  @default(true)    // soft-delete pattern
}
```

**Table naming:** `@@map("snake_case_table_name")`

**Relation cascading:**
- `onDelete: Cascade` — owned entities (translations, images, junction tables)
- `onDelete: SetNull` — optional references (brandId on Product)

**Indexing strategy:**
- Foreign keys: `@@index([foreignKeyId])`
- Sort combos: `@@index([parentId, sortOrder])`
- Unique constraints: `@@unique([productId, locale])` for translations

## Multi-Tenancy

Tenant scoping is via `storeId` foreign key on:
- `Organization`, `PriceList`, `StockLevel`, `Warehouse`, `DomainSpace`, `HostBinding`, `ProductStore`

**No database-level RLS** — scoping is enforced at application level. The `INFR-01` requirement (tenant-scoping middleware) is planned but not yet built.

`ProductStore` is a junction table with `isVisible` flag — products are associated per store with visibility control.

## Key Domain Patterns

### Product (most complex model)

```
Product → ProductTranslation[]     (1:N, per locale)
       → ProductVariantGroup[]     (variant axes: color, size)
       → ProductVariant[]          (purchasable SKUs)
       → ProductCategory[]         (junction)
       → ProductTag[]              (junction)
       → ProductStore[]            (junction, per-store visibility)
       → Image[]                   (polymorphic)

ProductVariant → StockLevel[]      (per warehouse)
              → PriceListPrice[]   (per price list)
              → Image[]            (variant-specific)
              → Batch[], SerialNumber[]  (tracking)
```

`ProductTranslation` has `@@unique([productId, locale])` — one translation per language.
`ProductVariant.sku` is `@unique` globally.

### Organization Hierarchy (closure table)

```
Organization → OrganizationMember[] (with role: OWNER/MANAGER/MEMBER)

OrganizationMember → parentMemberId (self-referential tree)
                   → OrgMemberClosure[] (closure table for tree queries)

OrgMemberClosure {
  ancestorId    → OrganizationMember
  descendantId  → OrganizationMember
  depth         Int  // 0 = self, 1 = direct child, 2+ = deeper
}
```

Enables efficient "find all subordinates" queries without recursive CTEs.

### Image (polymorphic ownership)

Single `Image` model with multiple optional foreign keys — only one non-null at a time:

```prisma
model Image {
  productId                    String?  // → Product
  productVariantId             String?  // → ProductVariant
  categoryId                   String?  // → Category
  brandId                      String?  // → Brand
  tagId                        String?  // → Tag
  variantOptionId              String?  // → VariantOption
  productVariantGroupOptionId  String?  // → ProductVariantGroupOption
}
```

Polymorphism enforced at application level via `ImageOwnerType` enum mapping.

### Pricing (inheritance chain)

```
PriceList (BASE/SALE/CUSTOM) → PriceListPrice[] (per variant)
                              → PriceListCustomerGroup[] (who gets this pricing)

PriceListPrice {
  originType: FIXED | RELATIVE   // FIXED = explicit price, RELATIVE = derived
  price, compareAtPrice, costPrice
  adjustmentType, adjustmentValue  // for RELATIVE pricing
}
```

Price lists link to customer groups — organizations join groups to get negotiated pricing.

### Inventory (SAP-grade)

```
Warehouse → Zone[] → Bin[]           // Location hierarchy
StockLevel (per variant per warehouse)
  → reservedQty, availableQty, onHandQty, inTransitQty
StockMovement (12 types: GOODS_RECEIPT, GOODS_ISSUE, TRANSFER, etc.)
  → status: PENDING/CONFIRMED/CANCELLED
Batch, SerialNumber                   // Tracking strategies
```

## Enums

All 40+ enums live in `shared/enums.prisma`. Key ones:

| Enum | Values | Used By |
|------|--------|---------|
| `BusinessModel` | B2C, B2B | Store — determines storefront routing |
| `OrgMemberRole` | OWNER, MANAGER, MEMBER | OrganizationMember |
| `ProductStatus` | DRAFT, ACTIVE, ARCHIVED | Product lifecycle |
| `TrackingStrategy` | NONE, BATCH, SERIAL, BATCH_AND_SERIAL | ProductVariant |
| `PriceListType` | BASE, SALE, CUSTOM | PriceList |
| `PriceOriginType` | FIXED, RELATIVE | PriceListPrice |
| `MovementType` | 12 values | StockMovement |
| `Locale` | EN, TR | Translations |
| `FileType` | IMAGE, VIDEO, DOCUMENT, OTHER | Image, uploads |

## Package Exports

```typescript
import { PrismaClient } from '@org/prisma';           // server-side client
import { PrismaClient } from '@org/prisma/client';     // explicit client import
import { Locale, FileType, ... } from '@org/prisma/browser';  // browser-safe enums/types
```

`/browser` export is safe for frontend — no Node.js dependencies. Use it for enum imports in schemas and UI code.

## Seed Pattern (New Seeds — Preferred)

New seeds in `src/new-seeds/` follow a config-driven pattern:

```
{domain}-seed.ts         # Main seed script
{domain}-seed.config.ts  # Configurable counts, behaviors
{domain}-seed.utils.ts   # Shared utilities
{domain}.data.ts         # Sample data arrays
```

Uses `@faker-js/faker` for data generation. Config files allow env-var overrides (e.g., `PRODUCT_SEED_COUNT`).
