import {
  CUSTOMER_REFRESH_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} from '@org/constants/auth-constants';
import {
  createAuthClient,
  createStorefrontClient,
  registerAndGetCredentials,
  registerCustomer,
} from '../support/auth.helper.js';
import {
  createActiveStoreFixture,
  prisma,
  resetDomainFixtures,
} from '../support/prisma.helper.js';

function extractCookie(
  setCookie: string[] | string | undefined,
  cookieName: string
): string {
  const cookies = Array.isArray(setCookie) ? setCookie : [setCookie ?? ''];
  const cookie = cookies.find((value) => value.startsWith(`${cookieName}=`));

  if (!cookie) {
    throw new Error(`Missing cookie ${cookieName}`);
  }

  return cookie.split(';', 1)[0];
}

function uniqueSuffix(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

describe('Logout Session Revocation', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  beforeEach(async () => {
    await resetDomainFixtures();
  });

  afterAll(async () => {
    await resetDomainFixtures();
    await prisma.$disconnect();
  });

  it('revokes the current portal session and its refresh token on logout', async () => {
    const portalClient = createAuthClient();
    const { email, password } = await registerAndGetCredentials(portalClient);
    const loginRes = await portalClient.post('/api/auth/login', { email, password });
    const sessionId = loginRes.data.sessionId as string;
    const refreshCookie = extractCookie(
      loginRes.headers['set-cookie'],
      REFRESH_TOKEN_COOKIE_NAME
    );

    const logoutRes = await portalClient.post('/api/auth/logout');
    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    const replayClient = createAuthClient();
    const refreshRes = await replayClient.post('/api/auth/refresh', null, {
      headers: { Cookie: refreshCookie },
    });

    expect(logoutRes.status).toBe(200);
    expect(session?.isActive).toBe(false);
    expect(refreshRes.status).toBe(401);
  });

  it('revokes the current customer session and its refresh token on logout', async () => {
    const fixture = await createActiveStoreFixture(uniqueSuffix());
    const customerClient = createStorefrontClient(fixture.host);
    const registerRes = await registerCustomer(customerClient);
    const sessionId = registerRes.data.sessionId as string;
    const refreshCookie = extractCookie(
      registerRes.headers['set-cookie'],
      CUSTOMER_REFRESH_COOKIE_NAME
    );

    const logoutRes = await customerClient.post('/api/storefront/auth/logout');
    const session = await prisma.customerSession.findUnique({
      where: { id: sessionId },
    });
    const replayClient = createStorefrontClient(fixture.host);
    const refreshRes = await replayClient.post(
      '/api/storefront/auth/refresh',
      null,
      {
        headers: {
          Host: fixture.host,
          Cookie: refreshCookie,
        },
      }
    );

    expect(logoutRes.status).toBe(200);
    expect(session?.isActive).toBe(false);
    expect(refreshRes.status).toBe(401);
  });
});
