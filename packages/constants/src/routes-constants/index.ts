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
  PRODUCTS: '/admin/products',
  BRANDS: '/admin/products/brands',
  CATEGORIES: '/admin/products/categories',
  TAGS: '/admin/products/tags',
  VARIANTS: '/admin/products/variants',
  CUSTOMERS: '/admin/customers',
  ANALYTICS: '/admin/analytics',
  SETTINGS: '/admin/settings',
  MARKETING: '/admin/marketing',
  INVENTORY: '/admin/inventory',
  DISCOUNTS: '/admin/discounts',
  REPORTS: '/admin/reports',
  DEFINITIONS: '/admin/definitions',
  LOCATIONS: '/admin/definitions/locations',
} as const;
