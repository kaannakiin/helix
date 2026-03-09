import { ACCESS_TOKEN_COOKIE_NAME } from '@org/constants/auth-constants';
import { createServerFetch } from '@org/utils/http/create-server-fetch';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || 'http://localhost:3003';

export const serverFetch = createServerFetch({
  backendUrl: BACKEND_URL,
  accessTokenCookieName: ACCESS_TOKEN_COOKIE_NAME,
  unauthorizedRedirect: '/auth?tab=login',
  deps: { cookies, headers, redirect },
});
