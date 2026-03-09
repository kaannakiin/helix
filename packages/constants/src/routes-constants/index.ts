export const PUBLIC_ROUTES = [
  '/forgot-password',
  '/auth',
  '/api/admin/auth',
  '/api/locations',
];
export const AUTH_ROUTES = ['/auth'];
export const ADMIN_ROUTES = [
  '/dashboard',
  '/orders',
  '/stores',
  '/products',
  '/customers',
  '/organizations',
  '/inventory',
  '/definitions',
  '/settings',
];
export const ADMIN_API_ROUTES = ['/api/admin'];

export const ADMIN_NAV_ROUTES = {
  DASHBOARD: '/dashboard',
  ORDERS: '/orders',
  STORES: '/stores',
  PRODUCTS: '/products',
  BRANDS: '/products/brands',
  CATEGORIES: '/products/categories',
  TAGS: '/products/tags',
  VARIANTS: '/products/variants',
  CUSTOMERS: '/customers',
  CUSTOMER_GROUPS: '/customers/customer-groups',
  ORGANIZATIONS: '/organizations',
  ANALYTICS: '/analytics',
  SETTINGS: '/settings',
  MARKETING: '/marketing',
  INVENTORY: '/inventory',
  DISCOUNTS: '/discounts',
  REPORTS: '/reports',
  WAREHOUSES: '/inventory/warehouses',
  DEFINITIONS: '/definitions',
  LOCATIONS: '/definitions/locations',
  PRICE_LISTS: '/definitions/price-lists',
  EVALUATION_JOBS: '/definitions/evaluation-jobs',
  PLATFORM: '/settings/platform',
} as const;
