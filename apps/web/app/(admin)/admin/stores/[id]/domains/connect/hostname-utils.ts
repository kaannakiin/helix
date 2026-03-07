/**
 * Client-side hostname utilities for domain wizard.
 * Mirrors key functions from backend domain-utils.ts.
 */

export function normalizeHostname(value: string): string {
  return value.trim().toLowerCase().replace(/\.+$/, '');
}

export function extractBaseDomain(hostname: string): string {
  const normalized = normalizeHostname(hostname);
  const parts = normalized.split('.');
  if (parts.length <= 2) return normalized;
  return parts.slice(-2).join('.');
}

export function isApexHostname(
  hostname: string,
  baseDomain: string
): boolean {
  return normalizeHostname(hostname) === normalizeHostname(baseDomain);
}
