import {
  createAuthClient,
  registerAndGetCredentials,
  loginUser,
} from '../support/auth.helper';

describe('Auth Logout', () => {
  describe('POST /api/auth/logout', () => {
    it('should logout and clear cookies', async () => {
      const client = createAuthClient();
      const { email, password } = await registerAndGetCredentials(client);

      const authClient = createAuthClient();
      await loginUser(authClient, email, password);

      const res = await authClient.post('/api/auth/logout');

      expect(res.status).toBe(200);
      expect(res.data.message).toBe('Logged out successfully');

      // After logout, accessing /me should fail
      const meRes = await authClient.get('/api/auth/me');
      expect(meRes.status).toBe(401);
    });

    it('should return 401 for unauthenticated logout', async () => {
      const client = createAuthClient();
      const res = await client.post('/api/auth/logout');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout-all', () => {
    it('should revoke all sessions', async () => {
      const client = createAuthClient();
      const { email, password } = await registerAndGetCredentials(client);

      // Login from two different clients
      const client1 = createAuthClient();
      await loginUser(client1, email, password);

      const client2 = createAuthClient();
      await loginUser(client2, email, password);

      // Logout all from client1
      const res = await client1.post('/api/auth/logout-all');

      expect(res.status).toBe(200);
      expect(res.data.message).toBe('All sessions revoked');

      // client1 cookies are cleared by logout-all → /me should 401
      const me1 = await client1.get('/api/auth/me');
      expect(me1.status).toBe(401);

      // client2 still has a valid JWT access token (stateless, not expired)
      // but its refresh token & session are revoked → refresh should fail
      const refresh2 = await client2.post('/api/auth/refresh');
      expect(refresh2.status).toBe(401);
    });

    it('should return 401 for unauthenticated logout-all', async () => {
      const client = createAuthClient();
      const res = await client.post('/api/auth/logout-all');

      expect(res.status).toBe(401);
    });
  });
});
