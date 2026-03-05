# Prisma Package

Prisma 7 with PostgreSQL. Multi-file schema in `prisma/schema/` (25 files). Generated client output: `generated/prisma`. Three export paths: `.` (default), `./client`, `./browser`.

```bash
# Run from packages/prisma
npx prisma generate          # uses prisma.config.ts
npx prisma migrate dev       # multi-file schema in prisma/schema/
```

## Multi-Tenancy Architecture

**Store is the primary tenant boundary.** All domain data is scoped through Store either directly or via junction tables.

| Scoping                      | Entities                                                                                                       | Mechanism                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **Store-scoped (direct FK)** | Organization, CustomerGroup, PriceList, Warehouse, RuleTree                                                    | `storeId` field with `onDelete: Cascade`                              |
| **Store-scoped (junction)**  | Product, Category                                                                                              | `ProductStore`, `CategoryStore` junction tables with `isVisible` flag |
| **Global (no storeId)**      | Brand, Tag, TagGroup, VariantGroup, VariantOption, GoogleTaxonomy, UnitOfMeasure, Currency, Country/State/City | Shared across all stores                                              |

**Why global?** Brand, Tag, VariantGroup etc. are universal concepts (e.g. "Apple", "Red", "XL"). Store-level visibility is controlled at the junction level (ProductStore, CategoryStore), not on the entity itself.

## Schema Files & Models

### Core

| File           | Models    | Description                                                                                                                                                                                                                     |
| -------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `base.prisma`  | —         | Datasource (PostgreSQL) and generator config                                                                                                                                                                                    |
| `enums.prisma` | —         | All enum definitions (see Enum Reference below)                                                                                                                                                                                 |
| `store.prisma` | **Store** | Primary tenant. Fields: name, slug (unique), businessModel (B2C/B2B), status, defaultLocale, currency, timezone. Relations: members, organizations, products, priceLists, customerGroups, warehouses, categoryStores, ruleTrees |

### Auth & Users

| File                  | Models                             | Description                                                                                                                                               |
| --------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `user.prisma`         | **User**                           | Auth user. Fields: name, surname, email (unique), phone (unique), role, status, accountType, 2FA fields. Central hub for sessions, devices, tokens, audit |
| `session.prisma`      | **Session**, **Device**            | Session with geo/device info. Device fingerprinting with trust status                                                                                     |
| `token.prisma`        | **RefreshToken**, **OAuthAccount** | JWT refresh tokens with family-based rotation chain ("TokenChain" self-relation). OAuth accounts (Google, Facebook, Instagram)                            |
| `audit.prisma`        | **LoginHistory**, **AccountEvent** | Login attempts with status/method/geo. Account lifecycle events                                                                                           |
| `store-member.prisma` | **StoreMember**                    | User-to-Store membership. `@@unique([storeId, userId])`. `@@map("store_members")`                                                                         |

### Catalog

| File              | Models                                                                                                                                                 | Description                                                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `product.prisma`  | **Product**, **ProductTranslation**, **ProductVariant**, **ProductStore**, **ProductVariantValue**, **ProductCategory**                                | Product with translations, variants (SKU), store visibility junction, category junction, variant option values        |
| `variant.prisma`  | **VariantGroup**, **VariantGroupTranslation**, **VariantOption**, **VariantOptionTranslation**, **ProductVariantGroup**, **ProductVariantGroupOption** | Global variant definitions (Color, Size) with product-level assignments and display settings                          |
| `category.prisma` | **Category**, **CategoryTranslation**, **CategoryStore**                                                                                               | Hierarchical categories (self-ref "CategoryHierarchy", depth tracked). Store visibility via CategoryStore junction    |
| `brand.prisma`    | **Brand**, **BrandTranslation**                                                                                                                        | Global brands. slug (unique), optional websiteUrl                                                                     |
| `tag.prisma`      | **TagGroup**, **TagGroupTranslation**, **Tag**, **TagTranslation**, **ProductTag**                                                                     | Hierarchical tags within groups (self-ref "TagHierarchy", depth tracked). `@@unique([tagGroupId, parentTagId, slug])` |
| `taxonomy.prisma` | **GoogleTaxonomy**, **GoogleTaxonomyTranslation**                                                                                                      | Google product taxonomy tree. Integer IDs (not cuid)                                                                  |
| `image.prisma`    | **Image**                                                                                                                                              | Polymorphic image model (see Polymorphic Image Pattern below)                                                         |

### Commerce

| File                    | Models                                                        | Description                                                                                                                              |
| ----------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `pricing.prisma`        | **PriceList**, **PriceListPrice**, **PriceListCustomerGroup** | Store-scoped price lists with inheritance chain ("PriceListInheritance"). Variant-level pricing (FIXED/RELATIVE). Customer group linkage |
| `currency.prisma`       | **Currency**                                                  | Global currencies with exchange rates. `code` (CurrencyCode enum) is unique                                                              |
| `customer-group.prisma` | **CustomerGroup**, **CustomerGroupMember**                    | Store-scoped groups (RULE_BASED/MANUAL). Members can be userId (B2C) or organizationId (B2B). Linked to RuleTree for auto-evaluation     |
| `rule.prisma`           | **RuleTree**                                                  | Store-scoped rule engine. Conditions stored as JSON. Targets: USER, PRODUCT, ORDER, INVENTORY                                            |
| `evaluation-job.prisma` | **EvaluationJob**                                             | Async rule evaluation tracking (Bull queue jobs). Status, duration, match counts                                                         |

### Inventory (SAP/ERP-aligned)

| File               | Models                                                                                        | SAP Equivalent               | Description                                                                                              |
| ------------------ | --------------------------------------------------------------------------------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------- |
| `warehouse.prisma` | **Warehouse**, **WarehouseTranslation**, **WarehouseZone**, **WarehouseBin**                  | Plant/Werk                   | Store-scoped warehouses with zones and bins. Geo-linked (Country/State/City)                             |
| `inventory.prisma` | **StockLevel**, **StockMovementGroup**, **StockMovement**, **Batch**, **SerialNumber**        | MARD, MKPF, MSEG, MCHA, SERI | Stock per variant/location/category/batch. Movement documents with line items. Batch and serial tracking |
| `uom.prisma`       | **UnitOfMeasure**, **UnitOfMeasureTranslation**, **UnitConversion**, **ProductUnitOfMeasure** | T006, T006A, MARM            | Global UoM definitions, conversion factors, product-specific UoM assignments                             |

### B2B

| File                  | Models                                   | Description                                                                                                                                  |
| --------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `organization.prisma` | **Organization**, **OrganizationMember** | Store-scoped B2B customer companies with hierarchy ("OrgHierarchy"). Member reporting chain ("MemberTree") with roles (OWNER/MANAGER/MEMBER) |

### Geolocation

| File                 | Models                                                                                              | Description                                                                             |
| -------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `geolocation.prisma` | **Country**, **CountryTranslation**, **State**, **StateTranslation**, **City**, **CityTranslation** | Global geo hierarchy. Country: ISO codes, currency info. Used by Warehouse for location |

## Key Patterns

### Translation Pattern

Nearly every entity has a `XTranslation` model with:

```prisma
@@unique([entityId, locale])   // one translation per locale
@@index([entityId])
@@index([locale])
```

Supported locales: `EN`, `TR` (defined in Locale enum).

### Self-Referential Hierarchies

Seven models use self-referential relations with named relation strings:

| Model              | Relation Name            | Depth Tracked | Notes                       |
| ------------------ | ------------------------ | ------------- | --------------------------- |
| Category           | `"CategoryHierarchy"`    | Yes           | parentId, depth field       |
| Tag                | `"TagHierarchy"`         | Yes           | parentTagId, depth field    |
| Organization       | `"OrgHierarchy"`         | No            | B2B company tree            |
| OrganizationMember | `"MemberTree"`           | No            | Reporting chain             |
| GoogleTaxonomy     | `"TaxonomyTree"`         | No            | Integer IDs                 |
| PriceList          | `"PriceListInheritance"` | No            | Pricing inheritance         |
| RefreshToken       | `"TokenChain"`           | No            | `replacedByTokenId @unique` |

### Polymorphic Image Model

Single `Image` model with 7 nullable foreign keys — exactly one is non-null per row:

```
productId, productVariantId, categoryId, brandId, tagId, variantOptionId, productVariantGroupOptionId
```

- `url @unique` — each URL appears once
- `isPrimary` — marks the main image for an entity
- `sortOrder` — controls display order
- Each FK has a dedicated `@@index`

### Junction Tables

Junction tables use `@@map` for snake_case PostgreSQL table names:

| Prisma Model           | Table Name        | Key Constraint                             | Extra Fields                    |
| ---------------------- | ----------------- | ------------------------------------------ | ------------------------------- |
| ProductStore           | `product_stores`  | `@@unique([productId, storeId])`           | isVisible, addedAt              |
| CategoryStore          | `category_stores` | `@@unique([categoryId, storeId])`          | isVisible, addedAt              |
| StoreMember            | `store_members`   | `@@unique([storeId, userId])`              | accountType, isActive, joinedAt |
| ProductCategory        | —                 | `@@unique([productId, categoryId])`        | sortOrder                       |
| ProductTag             | —                 | `@@unique([productId, tagId])`             | —                               |
| PriceListCustomerGroup | —                 | `@@unique([priceListId, customerGroupId])` | —                               |

### Product Architecture

```
Product (global, no storeId)
  ├── ProductTranslation (name, slug, description per locale)
  ├── ProductStore (junction → Store, isVisible)
  ├── ProductCategory (junction → Category, sortOrder)
  ├── ProductTag (junction → Tag)
  ├── Brand? (optional direct FK)
  ├── GoogleTaxonomy? (optional direct FK)
  ├── Image[] (polymorphic)
  ├── ProductVariantGroup (junction → VariantGroup, displayMode)
  │     └── ProductVariantGroupOption (junction → VariantOption)
  └── ProductVariant (purchasable SKU)
        ├── sku @unique, barcode, trackingStrategy
        ├── ProductVariantValue (junction → VariantOption)
        ├── PriceListPrice (price per PriceList)
        ├── StockLevel (stock per Warehouse/Zone/Bin/Batch)
        ├── Batch (lot tracking)
        ├── SerialNumber (serial tracking)
        ├── ProductUnitOfMeasure (variant-specific UoM)
        └── Image[] (variant-level images)
```

### Pricing Architecture

```
Store
  └── PriceList (BASE / SALE / CUSTOM)
        ├── parentPriceList? (inheritance: "PriceListInheritance")
        ├── adjustmentType + adjustmentValue (% or fixed markup/discount)
        ├── validFrom / validTo (time-bound pricing)
        ├── priority (resolution order)
        ├── PriceListPrice (per ProductVariant)
        │     ├── originType: FIXED | RELATIVE
        │     ├── price, minPrice, maxPrice, costPrice
        │     └── adjustmentType + adjustmentValue (price-level override)
        └── PriceListCustomerGroup (junction → CustomerGroup)
```

### Auth Architecture

```
User
  ├── Session (with geo/device info, revoke tracking)
  │     └── RefreshToken (family-based rotation, "TokenChain")
  ├── Device (fingerprinting, trust status)
  ├── LoginHistory (attempt logging)
  ├── AccountEvent (lifecycle audit)
  ├── OAuthAccount (Google, Facebook, Instagram)
  ├── StoreMember (store access)
  └── OrganizationMember (B2B company access)
```

## Enum Reference

| Enum                      | Values                                                                                                                                                       | Used By                    |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------- |
| `Locale`                  | EN, TR                                                                                                                                                       | All translations           |
| `CurrencyCode`            | TRY, USD, EUR, GBP                                                                                                                                           | Store, Currency, PriceList |
| `BusinessModel`           | B2C, B2B                                                                                                                                                     | Store                      |
| `StoreStatus`             | ACTIVE, INACTIVE, SUSPENDED                                                                                                                                  | Store                      |
| `UserRole`                | USER, ADMIN, MODERATOR                                                                                                                                       | User                       |
| `AccountStatus`           | ACTIVE, SUSPENDED, BANNED, DEACTIVATED                                                                                                                       | User                       |
| `AccountType`             | PERSONAL, BUSINESS                                                                                                                                           | User, StoreMember          |
| `ProductType`             | PHYSICAL, DIGITAL                                                                                                                                            | Product                    |
| `ProductStatus`           | DRAFT, ACTIVE, ARCHIVED                                                                                                                                      | Product                    |
| `VariantGroupType`        | COLOR, SIZE                                                                                                                                                  | VariantGroup               |
| `VariantGroupDisplayMode` | BADGE, SELECT, IMAGE_GRID                                                                                                                                    | ProductVariantGroup        |
| `TrackingStrategy`        | NONE, BATCH, SERIAL, BATCH_AND_SERIAL                                                                                                                        | ProductVariant             |
| `FileType`                | IMAGE, VIDEO, DOCUMENT, OTHER                                                                                                                                | Image                      |
| `PriceListType`           | BASE, SALE, CUSTOM                                                                                                                                           | PriceList                  |
| `PriceListStatus`         | ACTIVE, DRAFT, ARCHIVED                                                                                                                                      | PriceList                  |
| `PriceOriginType`         | FIXED, RELATIVE                                                                                                                                              | PriceListPrice             |
| `AdjustmentType`          | PERCENTAGE, FIXED_AMOUNT                                                                                                                                     | PriceList, PriceListPrice  |
| `StockCategory`           | UNRESTRICTED, QUALITY_CHECK, BLOCKED, IN_TRANSIT, RESERVED                                                                                                   | StockLevel, StockMovement  |
| `MovementType`            | GOODS_RECEIPT, GOODS_RECEIPT_REVERSAL, GOODS_ISSUE, GOODS_ISSUE_REVERSAL, TRANSFER_OUT, TRANSFER_IN, STOCK_ADJUSTMENT, QUALITY_RELEASE, QUALITY_BLOCK, SCRAP | StockMovementGroup         |
| `StockMovementStatus`     | DRAFT, POSTED, CANCELLED                                                                                                                                     | StockMovementGroup         |
| `WarehouseStatus`         | ACTIVE, INACTIVE, MAINTENANCE                                                                                                                                | Warehouse                  |
| `BinType`                 | STORAGE, RECEIVING, SHIPPING, STAGING, RETURNS, QUARANTINE                                                                                                   | WarehouseBin               |
| `CustomerGroupType`       | RULE_BASED, MANUAL                                                                                                                                           | CustomerGroup              |
| `RuleTargetEntity`        | USER, PRODUCT, ORDER, INVENTORY                                                                                                                              | RuleTree, EvaluationJob    |
| `EvaluationJobStatus`     | PENDING, RUNNING, COMPLETED, FAILED, CANCELLED                                                                                                               | EvaluationJob              |
| `EvaluationTrigger`       | SCHEDULED, MANUAL                                                                                                                                            | EvaluationJob              |
| `OrgMemberRole`           | OWNER, MANAGER, MEMBER                                                                                                                                       | OrganizationMember         |
| `DeviceType`              | DESKTOP, MOBILE, TABLET, UNKNOWN                                                                                                                             | Session, Device            |
| `LoginMethod`             | EMAIL, PHONE, OAUTH_GOOGLE, OAUTH_GITHUB, OAUTH_APPLE, OAUTH_FACEBOOK, OAUTH_INSTAGRAM, TWO_FACTOR                                                           | LoginHistory               |
| `LoginStatus`             | SUCCESS, FAILURE                                                                                                                                             | LoginHistory               |
| `SessionRevokeReason`     | USER_LOGOUT, USER_REVOKED, ADMIN_REVOKED, PASSWORD_CHANGED, SECURITY_CONCERN, TOKEN_ROTATION_ANOMALY, EXPIRED                                                | Session                    |
| `OAuthProvider`           | GOOGLE, FACEBOOK, INSTAGRAM                                                                                                                                  | OAuthAccount               |

## Rules

- **DO NOT** add `storeId` to global entities (Brand, Tag, TagGroup, VariantGroup, VariantOption, GoogleTaxonomy, UnitOfMeasure, Currency, Geolocation). If store-level filtering is needed, create a junction table with `isVisible` (like `CategoryStore`).
- **ALWAYS** create a `XTranslation` model with `@@unique([entityId, locale])` when adding a new entity that has user-facing text.
- **ALWAYS** add `@@unique` constraints on junction tables to prevent duplicate associations.
- **ALWAYS** use `@@map("snake_case_name")` on junction tables and entity tables that need custom PostgreSQL names.
- **ALWAYS** add a nullable FK + `@@index` on the `Image` model when adding a new entity that needs images.
- **ALWAYS** include `@@index` on foreign key fields for query performance.
- **ALWAYS** use `onDelete: Cascade` for child entities that cannot exist without their parent, `onDelete: SetNull` for optional references.
- **IMPORTANT**: If you are unsure about any schema detail (scoping, relation direction, constraint existence, field types), read the relevant `.prisma` file or ask the user. Do not guess or assume.
