import {
  createAuthClient,
  registerAndGetCredentials,
  loginUser,
  DEFAULT_PASSWORD,
} from '../support/auth.helper.js';

describe('POST /api/auth/login', () => {
  it('should login with correct email and password', async () => {
    const client = createAuthClient();
    const { email, password } = await registerAndGetCredentials(client);

    // Login with a fresh client to get clean cookies
    const loginClient = createAuthClient();
    const res = await loginUser(loginClient, email, password);

    expect(res.status).toBe(200);
    expect(res.data.message).toBe('Authentication successful');
    expect(res.data.user).toBeDefined();
    expect(res.data.user.email).toBe(email);
    expect(res.data.sessionId).toBeDefined();
    expect(res.data.deviceId).toBeDefined();

    // Should have set cookies
    const setCookie = res.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    const cookieStr = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie;
    expect(cookieStr).toContain('token=');
    expect(cookieStr).toContain('refresh_token');
  });

  it('should return 401 for wrong password', async () => {
    const client = createAuthClient();
    const { email } = await registerAndGetCredentials(client);

    const loginClient = createAuthClient();
    const res = await loginUser(loginClient, email, 'WrongPassword123');

    expect(res.status).toBe(401);
  });

  it('should return 401 for non-existent user', async () => {
    const client = createAuthClient();
    const res = await loginUser(client, 'nonexistent@e2e.test', DEFAULT_PASSWORD);

    expect(res.status).toBe(401);
  });

  it('should return 401 when email is missing', async () => {
    const client = createAuthClient();
    const res = await client.post('/api/auth/login', {
      password: DEFAULT_PASSWORD,
    });

    expect(res.status).toBe(401);
  });

  it('should return 401 when password is missing', async () => {
    const client = createAuthClient();
    const { email } = await registerAndGetCredentials(client);

    const loginClient = createAuthClient();
    const res = await loginClient.post('/api/auth/login', { email });

    expect(res.status).toBe(401);
  });
});
