import {
  createAuthClient,
  registerAndGetCredentials,
  loginUser,
} from '../support/auth.helper.js';

describe('Auth Devices', () => {
  describe('GET /api/auth/devices', () => {
    it('should return device list after login', async () => {
      const client = createAuthClient();
      const { email, password } = await registerAndGetCredentials(client);

      const authClient = createAuthClient();
      await loginUser(authClient, email, password);

      const res = await authClient.get('/api/auth/devices');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
      expect(res.data.length).toBeGreaterThanOrEqual(1);

      const device = res.data[0];
      expect(device.id).toBeDefined();
      expect(device.deviceType).toBeDefined();
    });

    it('should return 401 for unauthenticated request', async () => {
      const client = createAuthClient();
      const res = await client.get('/api/auth/devices');

      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /api/auth/devices/:id/trust', () => {
    it('should toggle device trust status', async () => {
      const client = createAuthClient();
      const { email, password } = await registerAndGetCredentials(client);

      const authClient = createAuthClient();
      await loginUser(authClient, email, password);

      // Get the device list
      const devicesRes = await authClient.get('/api/auth/devices');
      expect(devicesRes.data.length).toBeGreaterThanOrEqual(1);
      const deviceId = devicesRes.data[0].id;

      // Toggle trust to true
      const trustRes = await authClient.patch(
        `/api/auth/devices/${deviceId}/trust`,
        { isTrusted: true }
      );

      expect(trustRes.status).toBe(200);
      expect(trustRes.data.isTrusted).toBe(true);

      // Toggle trust to false
      const untrustRes = await authClient.patch(
        `/api/auth/devices/${deviceId}/trust`,
        { isTrusted: false }
      );

      expect(untrustRes.status).toBe(200);
      expect(untrustRes.data.isTrusted).toBe(false);
    });
  });

  describe('DELETE /api/auth/devices/:id', () => {
    it('should delete a device', async () => {
      const client = createAuthClient();
      const { email, password } = await registerAndGetCredentials(client);

      const authClient = createAuthClient();
      await loginUser(authClient, email, password);

      // Get the device list
      const devicesRes = await authClient.get('/api/auth/devices');
      const deviceId = devicesRes.data[0].id;

      const res = await authClient.delete(`/api/auth/devices/${deviceId}`);

      expect(res.status).toBe(200);
    });

    it('should return 401 for unauthenticated request', async () => {
      const client = createAuthClient();
      const res = await client.delete('/api/auth/devices/some-fake-id');

      expect(res.status).toBe(401);
    });
  });
});
