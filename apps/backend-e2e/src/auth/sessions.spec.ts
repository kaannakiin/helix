import {
  createAuthClient,
  registerAndGetCredentials,
  loginUser,
} from '../support/auth.helper';

describe('Auth Sessions', () => {
  describe('GET /api/auth/sessions', () => {
    it('should return active sessions after login', async () => {
      const client = createAuthClient();
      const { email, password } = await registerAndGetCredentials(client);

      const authClient = createAuthClient();
      await loginUser(authClient, email, password);

      const res = await authClient.get('/api/auth/sessions');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
      expect(res.data.length).toBeGreaterThanOrEqual(1);

      const session = res.data[0];
      expect(session.id).toBeDefined();
      expect(session.isActive).toBe(true);
    });

    it('should return 401 for unauthenticated request', async () => {
      const client = createAuthClient();
      const res = await client.get('/api/auth/sessions');

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/auth/sessions/:id', () => {
    it('should revoke a specific session', async () => {
      const client = createAuthClient();
      const { email, password } = await registerAndGetCredentials(client);

      // Login to create a session
      const authClient = createAuthClient();
      const loginRes = await loginUser(authClient, email, password);
      const sessionId = loginRes.data.sessionId;

      // Create another session to use for revoking
      const adminClient = createAuthClient();
      await loginUser(adminClient, email, password);

      // Revoke the first session
      const res = await adminClient.delete(`/api/auth/sessions/${sessionId}`);

      expect(res.status).toBe(200);
    });

    it('should return 401 for unauthenticated request', async () => {
      const client = createAuthClient();
      const res = await client.delete('/api/auth/sessions/some-fake-id');

      expect(res.status).toBe(401);
    });
  });
});
