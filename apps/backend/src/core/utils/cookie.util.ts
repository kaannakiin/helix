import {
  ACCESS_COOKIE_PATH,
  ACCESS_TOKEN_COOKIE_NAME,
  ACCESS_TOKEN_EXPIRY_MS,
  CUSTOMER_ACCESS_COOKIE_NAME,
  CUSTOMER_ACCESS_TOKEN_EXPIRY_MS,
  CUSTOMER_REFRESH_COOKIE_NAME,
  CUSTOMER_REFRESH_TOKEN_EXPIRY_DAYS,
  REFRESH_COOKIE_PATH,
  REFRESH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_EXPIRY_DAYS,
} from '@org/constants/auth-constants';
import type { CookieOptions, Response } from 'express';

function baseCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  };
}

// ─── Admin (Portal) Cookies ──────────────────────────────────────────────────

export function setAccessTokenCookie(res: Response, token: string): void {
  res.cookie(ACCESS_TOKEN_COOKIE_NAME, token, {
    ...baseCookieOptions(),
    path: ACCESS_COOKIE_PATH,
    maxAge: ACCESS_TOKEN_EXPIRY_MS,
  });
}

export function setRefreshTokenCookie(res: Response, token: string): void {
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, token, {
    ...baseCookieOptions(),
    path: REFRESH_COOKIE_PATH,
    maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_TOKEN_COOKIE_NAME, { path: ACCESS_COOKIE_PATH });
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, { path: REFRESH_COOKIE_PATH });
}

// ─── Customer (Storefront) Cookies ───────────────────────────────────────────

export function setCustomerAccessTokenCookie(
  res: Response,
  token: string,
): void {
  res.cookie(CUSTOMER_ACCESS_COOKIE_NAME, token, {
    ...baseCookieOptions(),
    maxAge: CUSTOMER_ACCESS_TOKEN_EXPIRY_MS,
  });
}

export function setCustomerRefreshTokenCookie(
  res: Response,
  token: string,
): void {
  res.cookie(CUSTOMER_REFRESH_COOKIE_NAME, token, {
    ...baseCookieOptions(),
    maxAge: CUSTOMER_REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  });
}

export function clearCustomerAuthCookies(res: Response): void {
  res.clearCookie(CUSTOMER_ACCESS_COOKIE_NAME, { path: '/' });
  res.clearCookie(CUSTOMER_REFRESH_COOKIE_NAME, { path: '/' });
}
