export function normalizeHostname(value: string): string {
  return value.trim().toLowerCase().replace(/\.+$/, '');
}

export function extractBaseDomain(hostname: string): string {
  const normalized = normalizeHostname(hostname);
  const parts = normalized.split('.');
  if (parts.length <= 2) return normalized;
  return parts.slice(-2).join('.');
}

export function isApexHostname(hostname: string, baseDomain: string): boolean {
  return normalizeHostname(hostname) === normalizeHostname(baseDomain);
}

export function isWwwHostname(hostname: string): boolean {
  return normalizeHostname(hostname).startsWith('www.');
}

/**
 * Returns the complementary hostname for www↔apex pairs.
 * apex (domain.com) → www.domain.com
 * www (www.domain.com) → domain.com
 * other subdomains (shop.domain.com) → null
 */
export function getComplementaryHostname(
  hostname: string,
  baseDomain: string
): string | null {
  const normalized = normalizeHostname(hostname);
  const normalizedBase = normalizeHostname(baseDomain);

  if (normalized === normalizedBase) {
    return `www.${normalizedBase}`;
  }
  if (normalized === `www.${normalizedBase}`) {
    return normalizedBase;
  }
  return null;
}
