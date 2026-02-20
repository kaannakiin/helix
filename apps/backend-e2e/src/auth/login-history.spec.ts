import {
  createAuthClient,
  registerAndGetCredentials,
  loginUser,
} from '../support/auth.helper';

describe('GET /api/auth/login-history', () => {
  it('should return login history after login', async () => {
    const client = createAuthClient();
    const { email, password } = await registerAndGetCredentials(client);

    const authClient = createAuthClient();
    await loginUser(authClient, email, password);

    const res = await authClient.get('/api/auth/login-history');

    expect(res.status).toBe(200);
    expect(res.data.data).toBeDefined();
    expect(Array.isArray(res.data.data)).toBe(true);
    expect(res.data.data.length).toBeGreaterThanOrEqual(1);
    expect(res.data.pagination.total).toBeGreaterThanOrEqual(1);
    expect(res.data.pagination.page).toBe(1);
    expect(res.data.pagination.limit).toBeDefined();
    expect(res.data.pagination.totalPages).toBeGreaterThanOrEqual(1);

    const entry = res.data.data[0];
    expect(entry.loginMethod).toBe('EMAIL');
    expect(entry.status).toBe('SUCCESS');
  });

  it('should support pagination', async () => {
    const client = createAuthClient();
    const { email, password } = await registerAndGetCredentials(client);

    // Login multiple times to create history entries
    for (let i = 0; i < 3; i++) {
      const c = createAuthClient();
      await loginUser(c, email, password);
    }

    const authClient = createAuthClient();
    await loginUser(authClient, email, password);

    // Request page 1 with limit 2
    const res = await authClient.get('/api/auth/login-history?page=1&limit=2');

    expect(res.status).toBe(200);
    expect(res.data.data.length).toBeLessThanOrEqual(2);
    expect(res.data.pagination.page).toBe(1);
    expect(res.data.pagination.limit).toBe(2);
    expect(res.data.pagination.total).toBeGreaterThanOrEqual(4); // register + 3 logins + 1 login
    expect(res.data.pagination.totalPages).toBeGreaterThanOrEqual(2);

    // Request page 2
    const res2 = await authClient.get('/api/auth/login-history?page=2&limit=2');

    expect(res2.status).toBe(200);
    expect(res2.data.pagination.page).toBe(2);
  });

  it('should return 401 for unauthenticated request', async () => {
    const client = createAuthClient();
    const res = await client.get('/api/auth/login-history');

    expect(res.status).toBe(401);
  });
});
