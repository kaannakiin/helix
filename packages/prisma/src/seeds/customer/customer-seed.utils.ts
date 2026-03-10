import { faker } from '@faker-js/faker';
import { createHash } from 'crypto';
import type {
  AccountStatus,
  AccountType,
  DeviceType,
  OAuthProvider,
  Prisma,
} from '../../client.js';
import {
  CUSTOMER_ID_PREFIX,
  CUSTOMER_SEED_BASE,
  CUSTOMER_SEED_EMAIL_DOMAIN,
  DEVICE_ID_PREFIX,
  OAUTH_ID_PREFIX,
  SESSION_ID_PREFIX,
  TOKEN_ID_PREFIX,
} from './customer-seed.config.js';

interface SeedStore {
  id: string;
  slug: string;
  name: string;
}

interface BuildCustomerScenarioParams {
  store: SeedStore;
  storeIndex: number;
  customerIndex: number;
  globalIndex: number;
  sharedPasswordHash: string;
  referenceDate: Date;
}

export interface SeedCustomerScenario {
  sampleEmail: string;
  customer: Prisma.CustomerUncheckedCreateInput;
  devices: Prisma.CustomerDeviceUncheckedCreateInput[];
  sessions: Prisma.CustomerSessionUncheckedCreateInput[];
  refreshTokens: Prisma.CustomerRefreshTokenUncheckedCreateInput[];
  oauthAccounts: Prisma.CustomerOAuthAccountUncheckedCreateInput[];
}

const DESKTOP_OS = ['Windows', 'macOS', 'Ubuntu'] as const;
const MOBILE_OS = ['iOS', 'Android'] as const;
const TABLET_OS = ['iPadOS', 'Android'] as const;

const DESKTOP_BROWSERS = ['Chrome', 'Safari', 'Firefox', 'Edge'] as const;
const MOBILE_BROWSERS = [
  'Mobile Safari',
  'Chrome Mobile',
  'Samsung Internet',
] as const;
const TABLET_BROWSERS = ['Safari', 'Chrome Mobile'] as const;

const DESKTOP_LABELS = ['MacBook Pro', 'ThinkPad X1', 'Dell XPS', 'iMac'] as const;
const MOBILE_LABELS = ['iPhone 15', 'Galaxy S24', 'Pixel 9'] as const;
const TABLET_LABELS = ['iPad Air', 'Galaxy Tab S10'] as const;

const OAUTH_PROVIDERS: OAuthProvider[] = ['GOOGLE', 'FACEBOOK', 'INSTAGRAM'];

const SESSION_REVOKE_REASONS = [
  'USER_REVOKED',
  'SECURITY_CONCERN',
  'EXPIRED',
] as const;

export function buildCustomerScenario(
  params: BuildCustomerScenarioParams,
): SeedCustomerScenario {
  const sequence = params.globalIndex + 1;
  const customerSeed = CUSTOMER_SEED_BASE + sequence;

  faker.seed(customerSeed);

  const customerId = createSeedId(CUSTOMER_ID_PREFIX, params.store.slug, sequence);
  const status = resolveAccountStatus(sequence);
  const accountType = resolveAccountType(sequence);
  const email = createCustomerEmail(params.store.slug, params.customerIndex);
  const phone = createCustomerPhone(params.storeIndex, params.customerIndex);
  const emailVerified = sequence % 8 !== 0;
  const phoneVerified = sequence % 6 !== 0;
  const twoFactorEnabled = status === 'ACTIVE' && sequence % 10 === 0;
  const createdAt = addDays(params.referenceDate, -(90 + (sequence % 330)));
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const avatar = sequence % 7 === 0 ? null : faker.image.avatar();

  const devices = buildCustomerDevices({
    customerId,
    sequence,
    createdAt,
    referenceDate: params.referenceDate,
    status,
    storeSlug: params.store.slug,
  });

  const sessions = buildCustomerSessions({
    customerId,
    sequence,
    createdAt,
    referenceDate: params.referenceDate,
    status,
    storeSlug: params.store.slug,
    devices,
  });

  const refreshTokens = buildRefreshTokens({
    customerId,
    sequence,
    storeSlug: params.store.slug,
    sessions,
    referenceDate: params.referenceDate,
  });

  const oauthAccounts = buildOAuthAccounts({
    customerId,
    sequence,
    storeSlug: params.store.slug,
    createdAt,
    referenceDate: params.referenceDate,
  });

  const lastLoginAt =
    sessions.length > 0
      ? new Date(
          Math.max(
            ...sessions.map((session) =>
              toDate(session.lastActivityAt, params.referenceDate).getTime(),
            ),
          ),
        )
      : null;

  const customer = {
    id: customerId,
    storeId: params.store.id,
    name: firstName,
    surname: lastName,
    email,
    phone,
    password: params.sharedPasswordHash,
    emailVerified,
    phoneVerified,
    avatar,
    status,
    accountType,
    twoFactorEnabled,
    twoFactorSecret: twoFactorEnabled ? `totp-${params.store.slug}-${sequence}` : null,
    lastLoginAt,
    loginCount: sessions.length,
    createdAt,
  } satisfies Prisma.CustomerUncheckedCreateInput;

  return {
    sampleEmail: email,
    customer,
    devices,
    sessions,
    refreshTokens,
    oauthAccounts,
  };
}

function buildCustomerDevices(params: {
  customerId: string;
  sequence: number;
  createdAt: Date;
  referenceDate: Date;
  status: AccountStatus;
  storeSlug: string;
}): Prisma.CustomerDeviceUncheckedCreateInput[] {
  const deviceCount = 1 + (params.sequence % 2);

  return Array.from({ length: deviceCount }, (_, deviceIndex) => {
    const deviceSeed = CUSTOMER_SEED_BASE + params.sequence * 100 + deviceIndex;
    faker.seed(deviceSeed);

    const deviceType = resolveDeviceType(params.sequence + deviceIndex);
    const osName = resolveOsName(deviceType, params.sequence + deviceIndex);
    const browserName = resolveBrowserName(
      deviceType,
      params.sequence + deviceIndex,
    );
    const rawFingerprint = `${params.customerId}:fingerprint:${deviceIndex + 1}`;
    const firstSeenAt = addDays(params.createdAt, 2 + deviceIndex * 6);
    const fallbackLastSeen = addDays(params.createdAt, 35 + deviceIndex * 8);
    const activeLastSeen = addHours(
      params.referenceDate,
      -(params.sequence % 72) - deviceIndex * 8,
    );
    const lastSeenAt =
      params.status === 'ACTIVE'
        ? maxDate(firstSeenAt, activeLastSeen)
        : maxDate(firstSeenAt, fallbackLastSeen);

    return {
      id: createSeedId(
        DEVICE_ID_PREFIX,
        params.storeSlug,
        params.sequence,
        deviceIndex + 1,
      ),
      customerId: params.customerId,
      deviceName: `${resolveDeviceLabel(deviceType, params.sequence + deviceIndex)} ${
        deviceIndex + 1
      }`,
      deviceType,
      browserName,
      browserVersion: faker.system.semver(),
      osName,
      osVersion: faker.system.semver(),
      fingerprint: createSha256(rawFingerprint),
      isTrusted: deviceIndex === 0 || params.sequence % 4 !== 0,
      firstSeenAt,
      lastSeenAt,
    } satisfies Prisma.CustomerDeviceUncheckedCreateInput;
  });
}

function buildCustomerSessions(params: {
  customerId: string;
  sequence: number;
  createdAt: Date;
  referenceDate: Date;
  status: AccountStatus;
  storeSlug: string;
  devices: Prisma.CustomerDeviceUncheckedCreateInput[];
}): Prisma.CustomerSessionUncheckedCreateInput[] {
  if (params.status !== 'ACTIVE') {
    return [];
  }

  const sessionCount = params.sequence % 4;
  if (sessionCount === 0) {
    return [];
  }

  const activeSessionCount =
    sessionCount === 1
      ? 1
      : Math.max(1, sessionCount - (params.sequence % 3 === 0 ? 1 : 0));

  return Array.from({ length: sessionCount }, (_, sessionIndex) => {
    const sessionSeed = CUSTOMER_SEED_BASE + params.sequence * 1000 + sessionIndex;
    faker.seed(sessionSeed);

    const linkedDevice = params.devices[sessionIndex % params.devices.length];
    const isActive = sessionIndex < activeSessionCount;
    const sessionCreatedAt = addDays(
      params.createdAt,
      5 + (params.sequence % 18) + sessionIndex * 14,
    );
    const lastActivityAt = isActive
      ? maxDate(
          sessionCreatedAt,
          addHours(
            params.referenceDate,
            -(params.sequence % 48) - sessionIndex * 6,
          ),
        )
      : addDays(sessionCreatedAt, 3 + sessionIndex);
    const revokedAt = isActive ? null : addHours(lastActivityAt, 1);
    const expiresAt = isActive
      ? addDays(params.referenceDate, 14 - sessionIndex)
      : addDays(lastActivityAt, 7);

    return {
      id: createSeedId(
        SESSION_ID_PREFIX,
        params.storeSlug,
        params.sequence,
        sessionIndex + 1,
      ),
      customerId: params.customerId,
      deviceId: linkedDevice.id,
      sessionToken: createDeterministicToken(
        `${params.customerId}:session:${sessionIndex + 1}`,
      ),
      ipAddress: faker.internet.ipv4(),
      userAgent: faker.internet.userAgent(),
      browserName: linkedDevice.browserName,
      browserVersion: linkedDevice.browserVersion,
      osName: linkedDevice.osName,
      osVersion: linkedDevice.osVersion,
      deviceType: linkedDevice.deviceType,
      city: faker.location.city(),
      country: faker.location.country(),
      lat: faker.location.latitude(),
      lng: faker.location.longitude(),
      isActive,
      revokedAt,
      revokeReason: isActive
        ? null
        : SESSION_REVOKE_REASONS[params.sequence % SESSION_REVOKE_REASONS.length],
      createdAt: sessionCreatedAt,
      lastActivityAt,
      expiresAt,
    } satisfies Prisma.CustomerSessionUncheckedCreateInput;
  });
}

function buildRefreshTokens(params: {
  customerId: string;
  sequence: number;
  storeSlug: string;
  sessions: Prisma.CustomerSessionUncheckedCreateInput[];
  referenceDate: Date;
}): Prisma.CustomerRefreshTokenUncheckedCreateInput[] {
  return params.sessions.map((session, sessionIndex) => {
    const sessionId = String(session.id);
    const isActive = Boolean(session.isActive);

    return {
      id: createSeedId(
        TOKEN_ID_PREFIX,
        params.storeSlug,
        params.sequence,
        sessionIndex + 1,
      ),
      customerId: params.customerId,
      sessionId,
      tokenHash: '',
      family: createSeedId(
        'seed_family',
        params.storeSlug,
        params.sequence,
        sessionIndex + 1,
      ),
      isRevoked: !isActive,
      replacedByTokenId: null,
      expiresAt: isActive
        ? addDays(params.referenceDate, 14 - sessionIndex)
        : addDays(params.referenceDate, -(sessionIndex + 1)),
      createdAt: addMinutes(toDate(session.createdAt, params.referenceDate), 5),
    };
  });
}

function buildOAuthAccounts(params: {
  customerId: string;
  sequence: number;
  storeSlug: string;
  createdAt: Date;
  referenceDate: Date;
}): Prisma.CustomerOAuthAccountUncheckedCreateInput[] {
  if (params.sequence % 5 !== 0) {
    return [];
  }

  const provider = OAUTH_PROVIDERS[params.sequence % OAUTH_PROVIDERS.length];
  const oauthId = createSeedId(OAUTH_ID_PREFIX, params.storeSlug, params.sequence);

  return [
    {
      id: oauthId,
      customerId: params.customerId,
      provider,
      providerAccountId: `${provider.toLowerCase()}-${params.storeSlug}-${params.sequence}`,
      accessToken: createDeterministicToken(`${oauthId}:access`),
      refreshToken: createDeterministicToken(`${oauthId}:refresh`),
      tokenExpiry: addDays(params.referenceDate, 30),
      scope:
        provider === 'GOOGLE'
          ? 'openid email profile'
          : 'public_profile basic',
      createdAt: addDays(params.createdAt, 2),
    } satisfies Prisma.CustomerOAuthAccountUncheckedCreateInput,
  ];
}

function resolveAccountStatus(sequence: number): AccountStatus {
  const statusBucket = sequence % 20;

  if (statusBucket === 16) {
    return 'SUSPENDED';
  }

  if (statusBucket === 17) {
    return 'BANNED';
  }

  if (statusBucket === 18) {
    return 'DEACTIVATED';
  }

  return 'ACTIVE';
}

function resolveAccountType(sequence: number): AccountType {
  return sequence % 6 === 0 ? 'BUSINESS' : 'PERSONAL';
}

function resolveDeviceType(sequence: number): DeviceType {
  const types: DeviceType[] = ['DESKTOP', 'MOBILE', 'TABLET'];
  return types[sequence % types.length];
}

function resolveOsName(deviceType: DeviceType, sequence: number): string {
  if (deviceType === 'DESKTOP') {
    return DESKTOP_OS[sequence % DESKTOP_OS.length];
  }

  if (deviceType === 'MOBILE') {
    return MOBILE_OS[sequence % MOBILE_OS.length];
  }

  if (deviceType === 'TABLET') {
    return TABLET_OS[sequence % TABLET_OS.length];
  }

  return 'Unknown OS';
}

function resolveBrowserName(deviceType: DeviceType, sequence: number): string {
  if (deviceType === 'DESKTOP') {
    return DESKTOP_BROWSERS[sequence % DESKTOP_BROWSERS.length];
  }

  if (deviceType === 'MOBILE') {
    return MOBILE_BROWSERS[sequence % MOBILE_BROWSERS.length];
  }

  if (deviceType === 'TABLET') {
    return TABLET_BROWSERS[sequence % TABLET_BROWSERS.length];
  }

  return 'Unknown Browser';
}

function resolveDeviceLabel(deviceType: DeviceType, sequence: number): string {
  if (deviceType === 'DESKTOP') {
    return DESKTOP_LABELS[sequence % DESKTOP_LABELS.length];
  }

  if (deviceType === 'MOBILE') {
    return MOBILE_LABELS[sequence % MOBILE_LABELS.length];
  }

  if (deviceType === 'TABLET') {
    return TABLET_LABELS[sequence % TABLET_LABELS.length];
  }

  return 'Unknown Device';
}

function createCustomerEmail(storeSlug: string, customerIndex: number): string {
  return `${storeSlug}.customer${String(customerIndex + 1).padStart(
    3,
    '0',
  )}@${CUSTOMER_SEED_EMAIL_DOMAIN}`;
}

function createCustomerPhone(storeIndex: number, customerIndex: number): string {
  return `+90555${String(storeIndex + 1).padStart(2, '0')}${String(
    customerIndex + 1,
  ).padStart(7, '0')}`;
}

function createSeedId(prefix: string, ...parts: Array<string | number>): string {
  return [prefix, ...parts]
    .map((part) =>
      String(part)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, ''),
    )
    .join('_');
}

function createDeterministicToken(value: string): string {
  return createHash('sha256').update(value).digest('base64url');
}

function createSha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function addDays(date: Date, amount: number): Date {
  const clone = new Date(date);
  clone.setUTCDate(clone.getUTCDate() + amount);
  return clone;
}

function addHours(date: Date, amount: number): Date {
  const clone = new Date(date);
  clone.setUTCHours(clone.getUTCHours() + amount);
  return clone;
}

function addMinutes(date: Date, amount: number): Date {
  const clone = new Date(date);
  clone.setUTCMinutes(clone.getUTCMinutes() + amount);
  return clone;
}

function toDate(value: Date | string | null | undefined, fallback: Date): Date {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'string') {
    return new Date(value);
  }

  return fallback;
}

function maxDate(left: Date, right: Date): Date {
  return left.getTime() >= right.getTime() ? left : right;
}
