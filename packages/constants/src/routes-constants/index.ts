export const PUBLIC_ROUTES = [
  '/forgot-password',
  '/auth',
  '/api/auth',
  '/api/locations',
];
export const AUTH_ROUTES = ['/auth'];
export const ADMIN_ROUTES = ['/admin'];
export const ADMIN_API_ROUTES = ['/api/admin'];

export const ADMIN_NAV_ROUTES = {
  DASHBOARD: '/admin',
  ORDERS: '/admin/orders',
  STORES: '/admin/stores',
  PRODUCTS: '/admin/products',
  BRANDS: '/admin/products/brands',
  CATEGORIES: '/admin/products/categories',
  TAGS: '/admin/products/tags',
  VARIANTS: '/admin/products/variants',
  CUSTOMERS: '/admin/customers',
  CUSTOMER_GROUPS: '/admin/customers/customer-groups',
  ORGANIZATIONS: '/admin/organizations',
  ANALYTICS: '/admin/analytics',
  SETTINGS: '/admin/settings',
  MARKETING: '/admin/marketing',
  INVENTORY: '/admin/inventory',
  DISCOUNTS: '/admin/discounts',
  REPORTS: '/admin/reports',
  WAREHOUSES: '/admin/inventory/warehouses',
  DEFINITIONS: '/admin/definitions',
  LOCATIONS: '/admin/definitions/locations',
  PRICE_LISTS: '/admin/definitions/price-lists',
  EVALUATION_JOBS: '/admin/definitions/evaluation-jobs',
  PLATFORM: '/admin/settings/platform',
} as const;
