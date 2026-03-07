import {
  DEFAULT_PASSWORD,
  createAuthClient,
  registerUser,
  uniqueEmail,
  uniquePhone,
} from '../support/auth.helper.js';

describe('POST /api/auth/register', () => {
  it('should register a user with email', async () => {
    const client = createAuthClient();
    const email = uniqueEmail();

    const res = await registerUser(client, { email });

    expect(res.status).toBe(201);
    expect(res.data.message).toBe('Authentication successful');
    expect(res.data.user).toBeDefined();
    expect(res.data.user.email).toBe(email);
    expect(res.data.user.name).toBe('Test');
    expect(res.data.user.surname).toBe('User');
    expect(res.data.sessionId).toBeDefined();
    expect(res.data.deviceId).toBeDefined();

    // Should have set cookies
    const setCookie = res.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    const cookieStr = Array.isArray(setCookie)
      ? setCookie.join('; ')
      : setCookie;
    expect(cookieStr).toContain('token=');
    expect(cookieStr).toContain('refresh_token');
  });

  it('should register a user with phone', async () => {
    const client = createAuthClient();
    const phone = uniquePhone();

    const res = await registerUser(client, {
      email: null,
      phone,
    });

    expect(res.status).toBe(201);
    expect(res.data.message).toBe('Authentication successful');
    expect(res.data.user.phone).toBe(phone);
  });

  it('should return 409 for duplicate email', async () => {
    const client = createAuthClient();
    const email = uniqueEmail();

    // First registration
    const first = await registerUser(client, { email });
    expect(first.status).toBe(201);

    // Second registration with same email
    const second = await registerUser(client, { email });
    expect(second.status).toBe(409);
  });

  it('should return 409 for duplicate phone', async () => {
    const client = createAuthClient();
    const phone = uniquePhone();

    // First registration
    const first = await registerUser(client, { email: null, phone });
    expect(first.status).toBe(201);

    // Second registration with same phone
    const second = await registerUser(client, { email: null, phone });
    expect(second.status).toBe(409);
  });

  it('should return 422 when neither email nor phone is provided', async () => {
    const client = createAuthClient();

    const res = await registerUser(client, { email: null, phone: null });

    expect(res.status).toBe(422);
  });

  it('should return 422 when passwords do not match', async () => {
    const client = createAuthClient();

    const res = await registerUser(client, {
      password: DEFAULT_PASSWORD,
      checkPassword: 'DifferentPass123',
    });

    expect(res.status).toBe(422);
  });

  it('should return 422 for short password', async () => {
    const client = createAuthClient();

    const res = await registerUser(client, {
      password: '12345',
      checkPassword: '12345',
    });

    expect(res.status).toBe(422);
  });
});
