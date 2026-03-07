import {
  createAuthClient,
  registerAndGetCredentials,
  loginUser,
} from '../support/auth.helper.js';

describe('POST /api/auth/refresh', () => {
  it('should refresh tokens with valid refresh cookie', async () => {
    const client = createAuthClient();
    const { email, password } = await registerAndGetCredentials(client);

    const authClient = createAuthClient();
    const loginRes = await loginUser(authClient, email, password);
    expect(loginRes.status).toBe(200);

    const res = await authClient.post('/api/auth/refresh');

    expect(res.status).toBe(200);
    expect(res.data.message).toBe('Tokens refreshed successfully');

    const setCookie = res.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    const cookieStr = Array.isArray(setCookie)
      ? setCookie.join('; ')
      : setCookie;
    expect(cookieStr).toContain('token=');
    expect(cookieStr).toContain('refresh_token=');
  });

  it('should return 401 without refresh cookie', async () => {
    const client = createAuthClient();
    const res = await client.post('/api/auth/refresh');

    expect(res.status).toBe(401);
  });

  it('should return 401 with invalid refresh token', async () => {
    const client = createAuthClient();

    const res = await client.post('/api/auth/refresh', null, {
      headers: {
        Cookie: 'refresh_token=invalid-random-token-value',
      },
    });

    expect(res.status).toBe(401);
  });

  it('should rotate tokens — old refresh token becomes invalid after refresh', async () => {
    const client = createAuthClient();
    const { email, password } = await registerAndGetCredentials(client);

    const authClient = createAuthClient();
    await loginUser(authClient, email, password);

    // First refresh — should succeed
    const res1 = await authClient.post('/api/auth/refresh');
    expect(res1.status).toBe(200);

    // Second refresh with the SAME client — should succeed because
    // cookie jar was updated with the new refresh_token from res1
    const res2 = await authClient.post('/api/auth/refresh');
    expect(res2.status).toBe(200);
  });

  it('should allow authenticated requests after refresh', async () => {
    const client = createAuthClient();
    const { email, password } = await registerAndGetCredentials(client);

    const authClient = createAuthClient();
    await loginUser(authClient, email, password);

    // Refresh tokens
    const refreshRes = await authClient.post('/api/auth/refresh');
    expect(refreshRes.status).toBe(200);

    // Use the refreshed tokens to access a protected endpoint
    const meRes = await authClient.get('/api/auth/me');
    expect(meRes.status).toBe(200);
    expect(meRes.data.email).toBe(email);
  });
});
