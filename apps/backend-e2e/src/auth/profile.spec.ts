import {
  createAuthClient,
  registerAndGetCredentials,
  loginUser,
} from '../support/auth.helper.js';

describe('Auth Profile', () => {
  describe('GET /api/auth/me', () => {
    it('should return current user profile', async () => {
      const client = createAuthClient();
      const { email } = await registerAndGetCredentials(client, {
        name: 'John',
        surname: 'Doe',
      });

      const authClient = createAuthClient();
      await loginUser(authClient, email);

      const res = await authClient.get('/api/auth/me');

      expect(res.status).toBe(200);
      expect(res.data.name).toBe('John');
      expect(res.data.surname).toBe('Doe');
      expect(res.data.email).toBe(email);
      // Password should never be returned
      expect(res.data.password).toBeUndefined();
    });

    it('should return 401 for unauthenticated request', async () => {
      const client = createAuthClient();
      const res = await client.get('/api/auth/me');

      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /api/auth/me', () => {
    it('should update user name', async () => {
      const client = createAuthClient();
      const { email } = await registerAndGetCredentials(client);

      const authClient = createAuthClient();
      await loginUser(authClient, email);

      const res = await authClient.patch('/api/auth/me', {
        name: 'Updated',
        surname: 'Name',
      });

      expect(res.status).toBe(200);
      expect(res.data.name).toBe('Updated');
      expect(res.data.surname).toBe('Name');

      // Verify the change persists
      const meRes = await authClient.get('/api/auth/me');
      expect(meRes.data.name).toBe('Updated');
      expect(meRes.data.surname).toBe('Name');
    });

    it('should return 401 for unauthenticated update', async () => {
      const client = createAuthClient();
      const res = await client.patch('/api/auth/me', { name: 'Hacker' });

      expect(res.status).toBe(401);
    });
  });
});
