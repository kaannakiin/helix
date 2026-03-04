import {
  ACCESS_TOKEN_COOKIE_NAME,
  LOCALE_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} from '@org/constants/auth-constants';
import {
  ADMIN_API_ROUTES,
  ADMIN_ROUTES,
  AUTH_ROUTES,
  PUBLIC_ROUTES,
} from '@org/constants/routes-constants';
import { defaultLocale, supportedLocales } from '@org/i18n';
import type { TokenPayload } from '@org/types/token';
import { jwtVerify } from 'jose';
import { NextResponse, type NextRequest } from 'next/server';
import { parse as parseSetCookie } from 'set-cookie-parser';

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || 'http://localhost:3001';

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

const ROLE_HIERARCHY: Record<string, number> = {
  USER: 0,
  MODERATOR: 1,
  ADMIN: 2,
};

function isAdminRoute(pathname: string): boolean {
  return [...ADMIN_ROUTES, ...ADMIN_API_ROUTES].some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
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

function resolveLocale(request: NextRequest): string {
  const localeCookie = request.cookies.get(LOCALE_COOKIE_NAME)?.value;
  return localeCookie &&
    (supportedLocales as readonly string[]).includes(localeCookie)
    ? localeCookie
    : defaultLocale;
}

type RefreshResult = {
  tokenPayload: TokenPayload;
  setCookieHeaders: string[];
};

let refreshPromise: Promise<RefreshResult | null> | null = null;

async function doRefresh(request: NextRequest): Promise<RefreshResult | null> {
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

    if (!res.ok) {
      return null;
    }

    const setCookieHeaders = res.headers.getSetCookie();

    if (!setCookieHeaders.length) return null;

    const newAccessToken = setCookieHeaders
      .find((h) => h.startsWith(`${ACCESS_TOKEN_COOKIE_NAME}=`))
      ?.match(/^[^=]+=([^;]+)/)?.[1];

    if (!newAccessToken) return null;

    const tokenPayload = await verifyAccessToken(newAccessToken);

    if (!tokenPayload) return null;

    return { tokenPayload, setCookieHeaders };
  } catch (e) {
    return null;
  }
}

async function tryRefreshTokens(
  request: NextRequest
): Promise<RefreshResult | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = doRefresh(request).finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
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

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/.well-known/')) {
    return NextResponse.next();
  }

  const locale = resolveLocale(request);

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value;
  let tokenPayload = accessToken ? await verifyAccessToken(accessToken) : null;
  let refreshedCookies: string[] | null = null;
  let shouldClearRefreshCookie = false;

  if (!tokenPayload) {
    const hasRefreshToken = !!request.cookies.get(REFRESH_TOKEN_COOKIE_NAME)
      ?.value;

    if (!isPublicRoute(pathname)) {
      if (pathname.startsWith('/api/')) {
        if (pathname === '/api/auth/refresh') {
          return NextResponse.next();
        }
        return NextResponse.json(
          { statusCode: 401, message: 'Unauthorized' },
          { status: 401 }
        );
      }

      const refreshResult = await tryRefreshTokens(request);
      if (refreshResult) {
        tokenPayload = refreshResult.tokenPayload;
        refreshedCookies = refreshResult.setCookieHeaders;
      } else if (hasRefreshToken) {
        shouldClearRefreshCookie = true;
      }
    } else if (hasRefreshToken) {
      const refreshResult = await tryRefreshTokens(request);
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

  if (tokenPayload) {
    for (const [key, value] of Object.entries(tokenPayload)) {
      if (value != null) {
        requestHeaders.set(`X-User-${key}`, encodeURIComponent(String(value)));
      }
    }
  }

  const storeId = request.cookies.get('x-store-id')?.value;
  if (storeId) {
    requestHeaders.set('X-Store-Id', storeId);
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  if (refreshedCookies) applyCookieHeaders(response, refreshedCookies);
  if (shouldClearRefreshCookie) response.cookies.delete(REFRESH_TOKEN_COOKIE_NAME);

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
