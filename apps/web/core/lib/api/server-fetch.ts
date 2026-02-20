import { cookies } from 'next/headers';
import { ACCESS_TOKEN_COOKIE_NAME } from '@org/constants';

const BACKEND_URL =
  process.env.BACKEND_INTERNAL_URL || 'http://localhost:3001';

export async function serverFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value;

  const headers = new Headers(options.headers);
  if (accessToken) {
    headers.set('Cookie', `${ACCESS_TOKEN_COOKIE_NAME}=${accessToken}`);
  }

  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`Server fetch failed: ${response.status}`);
  }

  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
