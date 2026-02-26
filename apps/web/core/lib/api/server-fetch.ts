import { ACCESS_TOKEN_COOKIE_NAME } from '@org/constants/auth-constants';
import { cookies, headers as nextHeaders } from 'next/headers';
import { redirect } from 'next/navigation';

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || 'http://localhost:3001';

export async function serverFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headersList = await nextHeaders();

  const freshToken = headersList.get('x-fresh-access-token');

  const cookieStore = await cookies();
  const accessToken =
    freshToken ?? cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value;

  const reqHeaders = new Headers(options.headers);
  if (accessToken) {
    reqHeaders.set('Cookie', `${ACCESS_TOKEN_COOKIE_NAME}=${accessToken}`);
  }

  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: reqHeaders,
  });

  if (response.status === 401) {
    redirect('/auth?tab=login');
  }

  if (!response.ok) {
    throw new Error(`Server fetch failed: ${response.status}`);
  }

  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
