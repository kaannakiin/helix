// ─── Authorization Context ───────────────────────────────────────────────────

export interface AuthorizationContext {
  /** Whether the user has access to all stores */
  allStores: boolean;
  /** Store IDs the user has access to (empty if allStores is true) */
  storeIds: string[];
  /** Capability strings the user has (e.g., "products:read") */
  capabilities: string[];
}

// ─── Capability Constants ────────────────────────────────────────────────────

export const CAPABILITIES = {
  // Store-scoped resources
  PRODUCTS_READ: 'products:read',
  PRODUCTS_WRITE: 'products:write',
  PRODUCTS_DELETE: 'products:delete',

  CUSTOMERS_READ: 'customers:read',
  CUSTOMERS_WRITE: 'customers:write',
  CUSTOMERS_DELETE: 'customers:delete',

  ORGANIZATIONS_READ: 'organizations:read',
  ORGANIZATIONS_WRITE: 'organizations:write',
  ORGANIZATIONS_DELETE: 'organizations:delete',

  WAREHOUSES_READ: 'warehouses:read',
  WAREHOUSES_WRITE: 'warehouses:write',
  WAREHOUSES_DELETE: 'warehouses:delete',

  PRICE_LISTS_READ: 'price_lists:read',
  PRICE_LISTS_WRITE: 'price_lists:write',
  PRICE_LISTS_DELETE: 'price_lists:delete',

  CUSTOMER_GROUPS_READ: 'customer_groups:read',
  CUSTOMER_GROUPS_WRITE: 'customer_groups:write',
  CUSTOMER_GROUPS_DELETE: 'customer_groups:delete',

  CATEGORIES_READ: 'categories:read',
  CATEGORIES_WRITE: 'categories:write',
  CATEGORIES_DELETE: 'categories:delete',

  // Capability-only resources (no store scoping)
  STORES_READ: 'stores:read',
  STORES_WRITE: 'stores:write',

  BRANDS_READ: 'brands:read',
  BRANDS_WRITE: 'brands:write',
  BRANDS_DELETE: 'brands:delete',

  TAGS_READ: 'tags:read',
  TAGS_WRITE: 'tags:write',
  TAGS_DELETE: 'tags:delete',

  VARIANTS_READ: 'variants:read',
  VARIANTS_WRITE: 'variants:write',

  SETTINGS_READ: 'settings:read',
  SETTINGS_WRITE: 'settings:write',

  USERS_READ: 'users:read',
  USERS_WRITE: 'users:write',
} as const;

export type Capability = (typeof CAPABILITIES)[keyof typeof CAPABILITIES];

/** All capability values as an array — useful for seeding full-admin users */
export const ALL_CAPABILITIES = Object.values(CAPABILITIES);
