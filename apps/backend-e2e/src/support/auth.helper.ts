import axios, { type AxiosInstance } from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';

export const DEFAULT_PASSWORD = 'TestPass123';

/**
 * Creates an axios instance with cookie jar support.
 * Each call returns a fresh instance with its own cookie store,
 * ensuring test isolation.
 */
export function createAuthClient(): AxiosInstance {
  const jar = new CookieJar();
  const client = wrapper(
    axios.create({
      baseURL: axios.defaults.baseURL,
      jar,
      withCredentials: true,
      validateStatus: () => true, // Don't throw on non-2xx
    })
  );
  return client;
}

/**
 * Generates a unique email for test isolation.
 * Format: test-{timestamp}-{random}@e2e.test
 */
export function uniqueEmail(): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).substring(2, 8);
  return `test-${ts}-${rand}@e2e.test`;
}

/**
 * Generates a unique phone number for test isolation.
 * Format: +9055X XXX XXXX (Turkish mobile)
 */
export function uniquePhone(): string {
  const rand = Math.floor(1000000000 + Math.random() * 9000000000)
    .toString()
    .substring(0, 9);
  return `+9055${rand}`;
}

/**
 * Register a user via the API. Returns the full axios response.
 */
export async function registerUser(
  client: AxiosInstance,
  overrides: {
    name?: string;
    surname?: string;
    email?: string | null;
    phone?: string | null;
    password?: string;
    checkPassword?: string;
  } = {}
) {
  const email = overrides.email !== undefined ? overrides.email : uniqueEmail();
  const password = overrides.password ?? DEFAULT_PASSWORD;

  const body = {
    name: overrides.name ?? 'Test',
    surname: overrides.surname ?? 'User',
    email,
    phone: overrides.phone !== undefined ? overrides.phone : null,
    password,
    checkPassword: overrides.checkPassword ?? password,
  };

  return client.post('/api/auth/register', body);
}

/**
 * Login a user via email + password. Returns the full axios response.
 */
export async function loginUser(
  client: AxiosInstance,
  email: string,
  password: string = DEFAULT_PASSWORD
) {
  return client.post('/api/auth/login', { email, password });
}

/**
 * Helper: register + return { email, password, response } for convenience.
 */
export async function registerAndGetCredentials(
  client: AxiosInstance,
  overrides: {
    name?: string;
    surname?: string;
    email?: string;
    password?: string;
  } = {}
) {
  const email = overrides.email ?? uniqueEmail();
  const password = overrides.password ?? DEFAULT_PASSWORD;

  const response = await registerUser(client, { ...overrides, email, password });

  return { email, password, response };
}
