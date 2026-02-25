import {
  ACCESS_COOKIE_PATH,
  ACCESS_TOKEN_COOKIE_NAME,
  ACCESS_TOKEN_EXPIRY_MS,
  REFRESH_COOKIE_PATH,
  REFRESH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_EXPIRY_DAYS,
} from '@org/constants/auth-constants';
import type { Response } from 'express';

export function setAccessTokenCookie(res: Response, token: string): void {
  res.cookie(ACCESS_TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: ACCESS_COOKIE_PATH,
    maxAge: ACCESS_TOKEN_EXPIRY_MS,
  });
}

export function setRefreshTokenCookie(res: Response, token: string): void {
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: REFRESH_COOKIE_PATH,
    maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_TOKEN_COOKIE_NAME, { path: ACCESS_COOKIE_PATH });
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, { path: REFRESH_COOKIE_PATH });
}
