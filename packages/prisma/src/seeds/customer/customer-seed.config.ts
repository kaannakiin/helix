export const CUSTOMER_SEED_BASE = 20260308;
export const CUSTOMER_SEED_MIN_COUNT = 300;
export const CUSTOMER_SEED_DEFAULT_COUNT = 360;
export const CUSTOMER_SEED_DEFAULT_PASSWORD = 'Customer123!';
export const CUSTOMER_SEED_EMAIL_DOMAIN = 'seed.helix.test';

export const CUSTOMER_ID_PREFIX = 'seed_customer';
export const DEVICE_ID_PREFIX = 'seed_device';
export const SESSION_ID_PREFIX = 'seed_session';
export const TOKEN_ID_PREFIX = 'seed_token';
export const OAUTH_ID_PREFIX = 'seed_oauth';

export function resolveCustomerSeedCount(rawValue?: string): number {
  if (!rawValue) {
    return CUSTOMER_SEED_DEFAULT_COUNT;
  }

  const parsedValue = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(parsedValue)) {
    return CUSTOMER_SEED_DEFAULT_COUNT;
  }

  return Math.max(parsedValue, CUSTOMER_SEED_MIN_COUNT);
}

export function resolveCustomerSeedPassword(rawValue?: string): string {
  const value = rawValue?.trim();
  return value && value.length > 0
    ? value
    : CUSTOMER_SEED_DEFAULT_PASSWORD;
}

export function allocateCustomersAcrossStores(
  totalCount: number,
  storeCount: number,
): number[] {
  if (storeCount <= 0) {
    return [];
  }

  const baseCount = Math.floor(totalCount / storeCount);
  const remainder = totalCount % storeCount;

  return Array.from({ length: storeCount }, (_, index) =>
    baseCount + (index < remainder ? 1 : 0),
  );
}
