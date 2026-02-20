import {
  createAuthClient,
  registerAndGetCredentials,
  loginUser,
  DEFAULT_PASSWORD,
} from '../support/auth.helper';

describe('POST /api/auth/change-password', () => {
  it('should change password and revoke all sessions', async () => {
    const client = createAuthClient();
    const { email } = await registerAndGetCredentials(client);

    const authClient = createAuthClient();
    await loginUser(authClient, email);

    const newPassword = 'NewSecure456';
    const res = await authClient.post('/api/auth/change-password', {
      currentPassword: DEFAULT_PASSWORD,
      newPassword,
      confirmNewPassword: newPassword,
    });

    expect(res.status).toBe(200);
    expect(res.data.message).toContain('Password changed');

    // Old session should be revoked (cookies cleared)
    const meRes = await authClient.get('/api/auth/me');
    expect(meRes.status).toBe(401);

    // Should be able to login with new password
    const newClient = createAuthClient();
    const loginRes = await loginUser(newClient, email, newPassword);
    expect(loginRes.status).toBe(200);
  });

  it('should return 400 for wrong current password', async () => {
    const client = createAuthClient();
    const { email } = await registerAndGetCredentials(client);

    const authClient = createAuthClient();
    await loginUser(authClient, email);

    const res = await authClient.post('/api/auth/change-password', {
      currentPassword: 'WrongCurrent123',
      newPassword: 'NewPass123',
      confirmNewPassword: 'NewPass123',
    });

    expect(res.status).toBe(400);
  });

  it('should return 422 when confirmNewPassword does not match', async () => {
    const client = createAuthClient();
    const { email } = await registerAndGetCredentials(client);

    const authClient = createAuthClient();
    await loginUser(authClient, email);

    const res = await authClient.post('/api/auth/change-password', {
      currentPassword: DEFAULT_PASSWORD,
      newPassword: 'NewPass123',
      confirmNewPassword: 'DifferentPass456',
    });

    expect(res.status).toBe(422);
  });

  it('should return 401 for unauthenticated request', async () => {
    const client = createAuthClient();
    const res = await client.post('/api/auth/change-password', {
      currentPassword: DEFAULT_PASSWORD,
      newPassword: 'NewPass123',
      confirmNewPassword: 'NewPass123',
    });

    expect(res.status).toBe(401);
  });
});
