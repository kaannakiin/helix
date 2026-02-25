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

async function tryRefreshTokens(
  request: NextRequest
): Promise<{ tokenPayload: TokenPayload; setCookieHeaders: string[] } | null> {
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

function applyCookieHeaders(
  response: NextResponse,
  setCookieHeaders: string[]
): void {
  for (const cookie of setCookieHeaders) {
    response.headers.append('Set-Cookie', cookie);
  }
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const locale = resolveLocale(request);

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value;
  let tokenPayload = accessToken ? await verifyAccessToken(accessToken) : null;
  let refreshedCookies: string[] | null = null;

  if (!tokenPayload && !isPublicRoute(pathname)) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { statusCode: 401, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const refreshResult = await tryRefreshTokens(request);
    if (refreshResult) {
      tokenPayload = refreshResult.tokenPayload;
      refreshedCookies = refreshResult.setCookieHeaders;
    }
  }

  const isAuthenticated = tokenPayload !== null;

  if (!isAuthenticated && !isPublicRoute(pathname)) {
    const loginUrl = new URL('/auth?tab=login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    const response = NextResponse.redirect(loginUrl);
    response.headers.set('X-NEXT-INTL-LOCALE', locale);
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

  return response;
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
