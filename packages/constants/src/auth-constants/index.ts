// ─── Admin (Portal) Auth ─────────────────────────────────────────────────────

export const ACCESS_TOKEN_COOKIE_NAME = '_ha_token';
export const REFRESH_TOKEN_COOKIE_NAME = '_ha_refresh';
export const ACCESS_TOKEN_EXPIRY = '30m';
export const ACCESS_TOKEN_EXPIRY_MS = 30 * 60 * 1000;
export const REFRESH_TOKEN_EXPIRY = '30d';
export const REFRESH_TOKEN_EXPIRY_DAYS = 30;
export const SESSION_EXPIRY_DAYS = 7;
export const MAX_ACTIVE_SESSIONS = 5;
export const ACCESS_COOKIE_PATH = '/';
export const REFRESH_COOKIE_PATH = '/';
export const AUTH_SYNC_COOKIE_NAME = 'auth_refreshed';

export const LOCAL_STRATEGY = 'local';
export const JWT_STRATEGY = 'jwt';
export const JWT_REFRESH_STRATEGY = 'jwt-refresh';
export const GOOGLE_STRATEGY = 'google';
export const FACEBOOK_STRATEGY = 'facebook';
export const INSTAGRAM_STRATEGY = 'instagram';

// ─── Customer (Storefront) Auth ──────────────────────────────────────────────

export const CUSTOMER_ACCESS_COOKIE_NAME = '_hc_token';
export const CUSTOMER_REFRESH_COOKIE_NAME = '_hc_refresh';
export const CUSTOMER_ACCESS_TOKEN_EXPIRY = '15m';
export const CUSTOMER_ACCESS_TOKEN_EXPIRY_MS = 15 * 60 * 1000;
export const CUSTOMER_REFRESH_TOKEN_EXPIRY = '14d';
export const CUSTOMER_REFRESH_TOKEN_EXPIRY_DAYS = 14;
export const CUSTOMER_SESSION_EXPIRY_DAYS = 14;
export const CUSTOMER_MAX_ACTIVE_SESSIONS = 3;

export const CUSTOMER_LOCAL_STRATEGY = 'customer-local';
export const CUSTOMER_JWT_STRATEGY = 'customer-jwt';
export const CUSTOMER_JWT_REFRESH_STRATEGY = 'customer-jwt-refresh';

// ─── Shared ──────────────────────────────────────────────────────────────────

export const LOCALE_COOKIE_NAME = 'LOCALE';
export const IS_PUBLIC_KEY = 'isPublic';
export const AUTH_SURFACE_KEY = 'authSurface';
export const STOREFRONT_AUTH_SURFACE = 'storefront';
export const LOCALE_HEADER_NAME = 'x-lang';
export const ACTIVE_STORE_COOKIE = 'x-store-id';
export const STORE_ID_HEADER = 'x-store-id';

// ─── Authorization ────────────────────────────────────────────────────────────

export const CAPABILITY_KEY = 'requiredCapability';
