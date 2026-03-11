import {
  CUSTOMER_ACCESS_COOKIE_NAME,
  CUSTOMER_REFRESH_COOKIE_NAME,
  LOCALE_COOKIE_NAME,
} from '@org/constants/auth-constants';
import { supportedLocales } from '@org/i18n';
import type { CustomerTokenPayload } from '@org/types/storefront';
import { jwtVerify } from 'jose';
import { NextResponse, type NextRequest } from 'next/server';
import { parse as parseSetCookie } from 'set-cookie-parser';

const BACKEND_URL =
  process.env.BACKEND_INTERNAL_URL || 'http://localhost:3003';
const DEFAULT_LOCALE = 'tr';

const PROTECTED_ROUTES = ['/account', '/checkout', '/orders'];
const AUTH_ROUTES = ['/auth'];

function resolveLocale(request: NextRequest): string {
  const localeCookie = request.cookies.get(LOCALE_COOKIE_NAME)?.value;
  if (
    localeCookie &&
    (supportedLocales as readonly string[]).includes(localeCookie)
  ) {
    return localeCookie;
  }
  return DEFAULT_LOCALE;
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

async function verifyAccessToken(
  token: string
): Promise<CustomerTokenPayload | null> {
  try {
    const secret = new TextEncoder().encode(
      process.env.CUSTOMER_JWT_SECRET
    );
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as CustomerTokenPayload;
  } catch {
    return null;
  }
}

type RefreshResult = {
  tokenPayload: CustomerTokenPayload;
  setCookieHeaders: string[];
};

let refreshPromise: Promise<RefreshResult | null> | null = null;

async function doRefresh(
  request: NextRequest
): Promise<RefreshResult | null> {
  const refreshToken = request.cookies.get(
    CUSTOMER_REFRESH_COOKIE_NAME
  )?.value;
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${BACKEND_URL}/api/storefront/auth/refresh`, {
      method: 'POST',
      headers: {
        Cookie: `${CUSTOMER_REFRESH_COOKIE_NAME}=${refreshToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) return null;

    const setCookieHeaders = res.headers.getSetCookie();
    if (!setCookieHeaders.length) return null;

    const newAccessToken = setCookieHeaders
      .find((h) => h.startsWith(`${CUSTOMER_ACCESS_COOKIE_NAME}=`))
      ?.match(/^[^=]+=([^;]+)/)?.[1];

    if (!newAccessToken) return null;

    const tokenPayload = await verifyAccessToken(newAccessToken);
    if (!tokenPayload) return null;

    return { tokenPayload, setCookieHeaders };
  } catch {
    return null;
  }
}

async function tryRefresh(
  request: NextRequest
): Promise<RefreshResult | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = doRefresh(request).finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/.well-known/')) {
    return NextResponse.next();
  }

  const locale = resolveLocale(request);

  const accessToken = request.cookies.get(
    CUSTOMER_ACCESS_COOKIE_NAME
  )?.value;
  let tokenPayload = accessToken
    ? await verifyAccessToken(accessToken)
    : null;
  let refreshedCookies: string[] | null = null;
  let shouldClearRefreshCookie = false;

  if (!tokenPayload) {
    const hasRefreshToken = !!request.cookies.get(
      CUSTOMER_REFRESH_COOKIE_NAME
    )?.value;

    if (hasRefreshToken) {
      const refreshResult = await tryRefresh(request);
      if (refreshResult) {
        tokenPayload = refreshResult.tokenPayload;
        refreshedCookies = refreshResult.setCookieHeaders;
      } else {
        shouldClearRefreshCookie = true;
      }
    }
  }

  const isAuthenticated = tokenPayload !== null;

  // Protected route without auth → redirect to login
  if (!isAuthenticated && isProtectedRoute(pathname)) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    const response = NextResponse.redirect(loginUrl);
    response.headers.set('X-NEXT-INTL-LOCALE', locale);
    if (shouldClearRefreshCookie) {
      response.cookies.delete(CUSTOMER_REFRESH_COOKIE_NAME);
    }
    return response;
  }

  // Authenticated on auth route → redirect to account
  if (isAuthenticated && isAuthRoute(pathname)) {
    const response = NextResponse.redirect(
      new URL('/account', request.url)
    );
    response.headers.set('X-NEXT-INTL-LOCALE', locale);
    if (refreshedCookies) applyCookieHeaders(response, refreshedCookies);
    return response;
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('X-NEXT-INTL-LOCALE', locale);
  requestHeaders.set('x-lang', locale);
  requestHeaders.set('x-realm', 'storefront');

  if (tokenPayload) {
    for (const [key, value] of Object.entries(tokenPayload)) {
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

  return response;
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
