import axios, { type AxiosInstance } from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import { hash as argon2Hash } from '@node-rs/argon2';
import { DEFAULT_PASSWORD, uniqueEmail } from './auth.helper.js';
import { prisma } from './prisma.helper.js';

const PORTAL_HOSTNAME = 'admin.helix.local';

/**
 * Creates an admin client with working cookie auth.
 *
 * The backend sets cookies with `domain: admin.helix.local` (from req.hostname),
 * but E2E tests hit `localhost:3003`. tough-cookie rejects cross-domain cookies,
 * so we strip the Domain attribute from Set-Cookie headers before storing them.
 */
export async function createAdminClient(): Promise<{
  client: AxiosInstance;
  email: string;
  password: string;
}> {
  const email = uniqueEmail();
  const password = DEFAULT_PASSWORD;

  // Create user directly in DB since admin auth has no register endpoint
  const hashedPassword = await argon2Hash(password);
  await prisma.user.create({
    data: {
      name: 'E2E',
      surname: 'Admin',
      email,
      password: hashedPassword,
      emailVerified: true,
    },
  });

  const jar = new CookieJar();
  const baseURL = axios.defaults.baseURL || 'http://localhost:3003';

  const client = (wrapper as any)(
    axios.create({
      baseURL,
      jar,
      headers: { Host: PORTAL_HOSTNAME },
      withCredentials: true,
      validateStatus: () => true,
    } as any)
  ) as AxiosInstance;

  // Login via API with portal hostname header
  const loginResponse = await client.post('/api/admin/auth/login', {
    email,
    password,
  });

  if (loginResponse.status !== 200) {
    throw new Error(
      `Failed to login admin user: ${loginResponse.status} — ${JSON.stringify(loginResponse.data)}`
    );
  }

  // Re-inject cookies without Domain attribute so they work on localhost
  const setCookies = loginResponse.headers['set-cookie'] ?? [];
  for (const raw of setCookies) {
    const stripped = raw.replace(/\s*Domain=[^;]+;?/gi, '');
    jar.setCookieSync(stripped, baseURL);
  }

  return { client, email, password };
}
