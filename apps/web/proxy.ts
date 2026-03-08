import {
  ACCESS_TOKEN_COOKIE_NAME,
  CUSTOMER_ACCESS_COOKIE_NAME,
  CUSTOMER_REFRESH_COOKIE_NAME,
  LOCALE_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} from '@org/constants/auth-constants';
import {
  ADMIN_API_ROUTES,
  ADMIN_ROUTES,
  AUTH_ROUTES,
  PUBLIC_ROUTES,
} from '@org/constants/routes-constants';
import { supportedLocales } from '@org/i18n';
import type { CustomerTokenPayload } from '@org/types/storefront';
import type { TokenPayload } from '@org/types/token';
import { jwtVerify } from 'jose';
import { NextResponse, type NextRequest } from 'next/server';
import { parse as parseSetCookie } from 'set-cookie-parser';
import { getDefaultLocale } from './core/lib/locale-cache';
import { getPortalHostname } from './core/lib/portal-hostname-cache';

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || 'http://localhost:3001';

const DEV_STORE_COOKIE = '_dev_store';
const DEV_STORE_PARAM = '_store';

interface StoreResolution {
  storeId: string;
  storeSlug: string;
  storeName: string;
}

type RequestRealm =
  | { type: 'admin' }
  | ({ type: 'storefront' } & StoreResolution)
  | { type: 'unknown' };

async function resolveStoreByHostname(
  hostname: string
): Promise<StoreResolution | null> {
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/storefront/domains/resolve?hostname=${encodeURIComponent(
        hostname
      )}`
    );
    if (!res.ok) return null;

    const data = await res.json();
    return {
      storeId: data.store?.id ?? data.storeId,
      storeSlug: data.store?.slug ?? data.storeSlug,
      storeName: data.store?.name ?? data.storeName,
    };
  } catch {
    return null;
  }
}

async function resolveRealm(request: NextRequest): Promise<RequestRealm> {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const storeParam = request.nextUrl.searchParams.get(DEV_STORE_PARAM);
    if (storeParam === 'admin') {
      return { type: 'admin' };
    }
    if (storeParam) {
      const store = await resolveStoreByHostname(storeParam);
      if (store) {
        return { type: 'storefront', ...store };
      }
    }

    const devStoreCookie = request.cookies.get(DEV_STORE_COOKIE)?.value;
    if (devStoreCookie) {
      const store = await resolveStoreByHostname(devStoreCookie);
      if (store) {
        return { type: 'storefront', ...store };
      }
    }

    return { type: 'admin' };
  }

  const host = request.headers.get('host')?.replace(/:\d+$/, '') ?? '';
  const portalHostname = await getPortalHostname();

  if (portalHostname && host === portalHostname) {
    return { type: 'admin' };
  }

  const store = await resolveStoreByHostname(host);
  if (store) {
    return { type: 'storefront', ...store };
  }

  return { type: 'unknown' };
}

async function resolveLocale(request: NextRequest): Promise<string> {
  const localeCookie = request.cookies.get(LOCALE_COOKIE_NAME)?.value;
  if (
    localeCookie &&
    (supportedLocales as readonly string[]).includes(localeCookie)
  ) {
    return localeCookie;
  }
  return getDefaultLocale();
}

function applyCookieHeaders(
  response: NextResponse,
  setCookieHeaders: string[]
): void {
  const parsed = parseSetCookie(setCookieHeaders);

  for (const cookie of parsed) {
    response.cookies.set(cookie.name, cookie.value, {
      path: cookie.path,
      maxAge: cookie.maxAge,
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      sameSite: cookie.sameSite as 'lax' | 'strict' | 'none' | undefined,
    });
  }
}

function applyLocaleCookie(
  request: NextRequest,
  response: NextResponse,
  locale: string
): void {
  const currentLocaleCookie = request.cookies.get(LOCALE_COOKIE_NAME)?.value;
  if (currentLocaleCookie !== locale) {
    response.cookies.set(LOCALE_COOKIE_NAME, locale, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 365 * 24 * 60 * 60,
      secure: process.env.NODE_ENV === 'production',
    });
  }
}

async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

type AdminRefreshResult = {
  tokenPayload: TokenPayload;
  setCookieHeaders: string[];
};

let adminRefreshPromise: Promise<AdminRefreshResult | null> | null = null;

async function doAdminRefresh(
  request: NextRequest
): Promise<AdminRefreshResult | null> {
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value;
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        Cookie: `${REFRESH_TOKEN_COOKIE_NAME}=${refreshToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) return null;

    const setCookieHeaders = res.headers.getSetCookie();
    if (!setCookieHeaders.length) return null;

    const newAccessToken = setCookieHeaders
      .find((h) => h.startsWith(`${ACCESS_TOKEN_COOKIE_NAME}=`))
      ?.match(/^[^=]+=([^;]+)/)?.[1];

    if (!newAccessToken) return null;

    const tokenPayload = await verifyAccessToken(newAccessToken);
    if (!tokenPayload) return null;

    return { tokenPayload, setCookieHeaders };
  } catch {
    return null;
  }
}

async function tryAdminRefresh(
  request: NextRequest
): Promise<AdminRefreshResult | null> {
  if (adminRefreshPromise) return adminRefreshPromise;

  adminRefreshPromise = doAdminRefresh(request).finally(() => {
    adminRefreshPromise = null;
  });

  return adminRefreshPromise;
}

async function verifyCustomerAccessToken(
  token: string
): Promise<CustomerTokenPayload | null> {
  try {
    const secret = new TextEncoder().encode(process.env.CUSTOMER_JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    if ((payload as Record<string, unknown>).aud !== 'storefront') return null;
    return payload as unknown as CustomerTokenPayload;
  } catch {
    return null;
  }
}

type CustomerRefreshResult = {
  tokenPayload: CustomerTokenPayload;
  setCookieHeaders: string[];
};

let customerRefreshPromise: Promise<CustomerRefreshResult | null> | null = null;

async function doCustomerRefresh(
  request: NextRequest
): Promise<CustomerRefreshResult | null> {
  const refreshToken = request.cookies.get(CUSTOMER_REFRESH_COOKIE_NAME)?.value;
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${BACKEND_URL}/api/storefront/auth/refresh`, {
      method: 'POST',
      headers: {
        Cookie: `${CUSTOMER_REFRESH_COOKIE_NAME}=${refreshToken}`,
        'Content-Type': 'application/json',
        Host: request.headers.get('host') ?? '',
      },
    });

    if (!res.ok) return null;

    const setCookieHeaders = res.headers.getSetCookie();
    if (!setCookieHeaders.length) return null;

    const newAccessToken = setCookieHeaders
      .find((h) => h.startsWith(`${CUSTOMER_ACCESS_COOKIE_NAME}=`))
      ?.match(/^[^=]+=([^;]+)/)?.[1];

    if (!newAccessToken) return null;

    const tokenPayload = await verifyCustomerAccessToken(newAccessToken);
    if (!tokenPayload) return null;

    return { tokenPayload, setCookieHeaders };
  } catch {
    return null;
  }
}

async function tryCustomerRefresh(
  request: NextRequest
): Promise<CustomerRefreshResult | null> {
  if (customerRefreshPromise) return customerRefreshPromise;

  customerRefreshPromise = doCustomerRefresh(request).finally(() => {
    customerRefreshPromise = null;
  });

  return customerRefreshPromise;
}

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route: string) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(
    (route: string) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function isAdminRoute(pathname: string): boolean {
  return [...ADMIN_ROUTES, ...ADMIN_API_ROUTES].some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

const ROLE_HIERARCHY: Record<string, number> = {
  USER: 0,
  MODERATOR: 1,
  ADMIN: 2,
};

function isStorefrontProtectedRoute(pathname: string): boolean {
  return pathname.startsWith('/account');
}

function isStorefrontAuthRoute(pathname: string): boolean {
  return pathname === '/login' || pathname === '/register';
}

async function handleAdminRequest(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const locale = await resolveLocale(request);

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value;
  let tokenPayload = accessToken ? await verifyAccessToken(accessToken) : null;
  let refreshedCookies: string[] | null = null;
  let shouldClearRefreshCookie = false;

  if (!tokenPayload) {
    const hasRefreshToken = !!request.cookies.get(REFRESH_TOKEN_COOKIE_NAME)
      ?.value;

    if (!isPublicRoute(pathname)) {
      if (pathname.startsWith('/api/')) {
        if (
          pathname === '/api/auth/refresh' ||
          pathname === '/api/revalidate-locale'
        ) {
          return NextResponse.next();
        }
        return NextResponse.json(
          { statusCode: 401, message: 'Unauthorized' },
          { status: 401 }
        );
      }

      const refreshResult = await tryAdminRefresh(request);
      if (refreshResult) {
        tokenPayload = refreshResult.tokenPayload;
        refreshedCookies = refreshResult.setCookieHeaders;
      } else if (hasRefreshToken) {
        shouldClearRefreshCookie = true;
      }
    } else if (hasRefreshToken) {
      const refreshResult = await tryAdminRefresh(request);
      if (refreshResult) {
        tokenPayload = refreshResult.tokenPayload;
        refreshedCookies = refreshResult.setCookieHeaders;
      } else {
        shouldClearRefreshCookie = true;
      }
    }
  }

  const isAuthenticated = tokenPayload !== null;

  if (!isAuthenticated && !isPublicRoute(pathname)) {
    const loginUrl = new URL('/auth?tab=login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    const response = NextResponse.redirect(loginUrl);
    response.headers.set('X-NEXT-INTL-LOCALE', locale);
    if (shouldClearRefreshCookie) {
      response.cookies.delete(REFRESH_TOKEN_COOKIE_NAME);
    }
    return response;
  }

  if (isAuthenticated && isAuthRoute(pathname)) {
    const response = NextResponse.redirect(new URL('/dashboard', request.url));
    response.headers.set('X-NEXT-INTL-LOCALE', locale);
    if (refreshedCookies) applyCookieHeaders(response, refreshedCookies);
    return response;
  }

  if (
    isAuthenticated &&
    isAdminRoute(pathname) &&
    (ROLE_HIERARCHY[tokenPayload!.role] ?? 0) < ROLE_HIERARCHY.MODERATOR
  ) {
    const response = NextResponse.redirect(new URL('/', request.url));
    response.headers.set('X-NEXT-INTL-LOCALE', locale);
    if (refreshedCookies) applyCookieHeaders(response, refreshedCookies);
    return response;
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('X-NEXT-INTL-LOCALE', locale);
  requestHeaders.set('x-lang', locale);
  requestHeaders.set('x-realm', 'admin');

  if (tokenPayload) {
    for (const [key, value] of Object.entries(tokenPayload)) {
      if (value != null) {
        requestHeaders.set(`X-User-${key}`, encodeURIComponent(String(value)));
      }
    }
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  if (refreshedCookies) applyCookieHeaders(response, refreshedCookies);
  if (shouldClearRefreshCookie)
    response.cookies.delete(REFRESH_TOKEN_COOKIE_NAME);

  applyLocaleCookie(request, response, locale);

  return response;
}

async function handleStorefrontRequest(
  request: NextRequest,
  realm: Extract<RequestRealm, { type: 'storefront' }>
): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const locale = await resolveLocale(request);

  if (isAdminRoute(pathname)) {
    return new NextResponse('Not Found', { status: 404 });
  }

  if (pathname.startsWith('/api/storefront/')) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-store-id', realm.storeId);
    requestHeaders.set('x-realm', 'storefront');
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const customerAccessToken = request.cookies.get(
    CUSTOMER_ACCESS_COOKIE_NAME
  )?.value;
  let customerPayload = customerAccessToken
    ? await verifyCustomerAccessToken(customerAccessToken)
    : null;
  let refreshedCookies: string[] | null = null;
  let shouldClearRefreshCookie = false;

  if (!customerPayload) {
    const hasRefreshToken = !!request.cookies.get(CUSTOMER_REFRESH_COOKIE_NAME)
      ?.value;

    if (hasRefreshToken) {
      const refreshResult = await tryCustomerRefresh(request);
      if (refreshResult) {
        customerPayload = refreshResult.tokenPayload;
        refreshedCookies = refreshResult.setCookieHeaders;
      } else {
        shouldClearRefreshCookie = true;
      }
    }
  }

  const isCustomerAuthenticated = customerPayload !== null;

  if (isStorefrontProtectedRoute(pathname) && !isCustomerAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    const response = NextResponse.redirect(loginUrl);
    response.headers.set('X-NEXT-INTL-LOCALE', locale);
    if (shouldClearRefreshCookie) {
      response.cookies.delete(CUSTOMER_REFRESH_COOKIE_NAME);
    }
    return response;
  }

  if (isCustomerAuthenticated && isStorefrontAuthRoute(pathname)) {
    const response = NextResponse.redirect(new URL('/account', request.url));
    response.headers.set('X-NEXT-INTL-LOCALE', locale);
    if (refreshedCookies) applyCookieHeaders(response, refreshedCookies);
    return response;
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('X-NEXT-INTL-LOCALE', locale);
  requestHeaders.set('x-lang', locale);
  requestHeaders.set('x-realm', 'storefront');
  requestHeaders.set('x-store-id', realm.storeId);
  requestHeaders.set('x-store-slug', realm.storeSlug);
  requestHeaders.set('x-store-name', encodeURIComponent(realm.storeName));

  if (customerPayload) {
    for (const [key, value] of Object.entries(customerPayload)) {
      if (value != null) {
        requestHeaders.set(
          `x-customer-${key}`,
          encodeURIComponent(String(value))
        );
      }
    }
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  if (refreshedCookies) applyCookieHeaders(response, refreshedCookies);
  if (shouldClearRefreshCookie)
    response.cookies.delete(CUSTOMER_REFRESH_COOKIE_NAME);

  applyLocaleCookie(request, response, locale);

  if (process.env.NODE_ENV !== 'production') {
    const storeParam = request.nextUrl.searchParams.get(DEV_STORE_PARAM);
    if (storeParam && storeParam !== 'admin') {
      response.cookies.set(DEV_STORE_COOKIE, storeParam, {
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
      });
    }
  }

  return response;
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/.well-known/')) {
    return NextResponse.next();
  }

  // DEBUG: proxy çalışıyor mu kontrol endpoint'i
  if (pathname === '/__helix-debug') {
    const host = request.headers.get('host') ?? '';
    const portalHostname = await getPortalHostname();
    const realm = await resolveRealm(request);
    return NextResponse.json({
      proxyActive: true,
      host,
      portalHostname,
      realm,
      backendUrl: BACKEND_URL,
      nodeEnv: process.env.NODE_ENV,
    });
  }

  if (process.env.NODE_ENV !== 'production') {
    const storeParam = request.nextUrl.searchParams.get(DEV_STORE_PARAM);
    if (storeParam === 'admin') {
      const cleanUrl = new URL(request.url);
      cleanUrl.searchParams.delete(DEV_STORE_PARAM);
      const response = NextResponse.redirect(cleanUrl);
      response.cookies.delete(DEV_STORE_COOKIE);
      return response;
    }
  }

  const realm = await resolveRealm(request);

  switch (realm.type) {
    case 'admin':
      return handleAdminRequest(request);
    case 'storefront':
      return handleStorefrontRequest(request, realm);
    case 'unknown':
      return new NextResponse('Store not found', { status: 404 });
  }
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
