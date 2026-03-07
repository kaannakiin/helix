import {
  DomainOnboardingMode,
  VerificationStatus,
  type DomainRoutingMethod,
} from '@org/prisma/client';
import type { DnsInstruction } from '@org/schemas/admin/settings';

export interface IngressTargets {
  canonicalTargetHost: string | null;
  ipv4Addresses: string[];
  ipv6Addresses: string[];
}

export const OWNERSHIP_RECORD_NAME = '_helix-verify';
export const ROUTING_CHALLENGE_PATH = '/.well-known/helix-routing';
export const WILDCARD_PROBE_LABEL = '__helix-wildcard-check';

export function normalizeHostname(value: string): string {
  return value.trim().toLowerCase().replace(/\.+$/, '');
}

export function isApexHostname(hostname: string, baseDomain: string): boolean {
  return normalizeHostname(hostname) === normalizeHostname(baseDomain);
}

export function isHostnameInDomainSpace(
  hostname: string,
  baseDomain: string
): boolean {
  const normalizedHostname = normalizeHostname(hostname);
  const normalizedBase = normalizeHostname(baseDomain);

  return (
    normalizedHostname === normalizedBase ||
    normalizedHostname.endsWith(`.${normalizedBase}`)
  );
}

export function getRecordName(hostname: string, baseDomain: string): string {
  const normalizedHostname = normalizeHostname(hostname);
  const normalizedBase = normalizeHostname(baseDomain);

  if (normalizedHostname === normalizedBase) return '@';
  if (!normalizedHostname.endsWith(`.${normalizedBase}`)) {
    throw new Error('Hostname does not belong to base domain');
  }

  return normalizedHostname.slice(0, -1 * `.${normalizedBase}`.length);
}

export function buildOwnershipDnsInstruction(token: string): DnsInstruction {
  return {
    type: 'TXT',
    name: OWNERSHIP_RECORD_NAME,
    value: token,
  };
}

export function getOwnershipLookupHostname(baseDomain: string): string {
  return `${OWNERSHIP_RECORD_NAME}.${normalizeHostname(baseDomain)}`;
}

export function buildApexDnsInstructions(
  ingress: IngressTargets
): DnsInstruction[] {
  const instructions: DnsInstruction[] = [];

  for (const ip of ingress.ipv4Addresses) {
    instructions.push({ type: 'A', name: '@', value: ip });
  }

  for (const ip of ingress.ipv6Addresses) {
    instructions.push({ type: 'AAAA', name: '@', value: ip });
  }

  return instructions;
}

export function buildExactHostDnsInstructions(
  hostname: string,
  baseDomain: string,
  ingress: IngressTargets
): DnsInstruction[] {
  if (isApexHostname(hostname, baseDomain)) {
    return buildApexDnsInstructions(ingress);
  }

  const name = getRecordName(hostname, baseDomain);

  if (ingress.canonicalTargetHost) {
    return [
      {
        type: 'CNAME',
        name,
        value: normalizeHostname(ingress.canonicalTargetHost),
      },
    ];
  }

  const instructions: DnsInstruction[] = [];
  for (const ip of ingress.ipv4Addresses) {
    instructions.push({ type: 'A', name, value: ip });
  }
  for (const ip of ingress.ipv6Addresses) {
    instructions.push({ type: 'AAAA', name, value: ip });
  }

  return instructions;
}

export function buildWildcardDnsInstructions(
  baseDomain: string,
  ingress: IngressTargets
): DnsInstruction[] {
  return buildExactHostDnsInstructions(
    `*.${normalizeHostname(baseDomain)}`,
    baseDomain,
    ingress
  );
}

export function buildWildcardProbeHostname(baseDomain: string): string {
  return `${WILDCARD_PROBE_LABEL}.${normalizeHostname(baseDomain)}`;
}

export function buildRoutingChallengeUrl(hostname: string): string {
  return `https://${normalizeHostname(hostname)}${ROUTING_CHALLENGE_PATH}`;
}

export function canAutoActivateBinding(params: {
  hostname: string;
  baseDomain: string;
  onboardingMode: DomainOnboardingMode;
  apexRoutingStatus: VerificationStatus;
  wildcardRoutingStatus: VerificationStatus;
}): boolean {
  const isApex = isApexHostname(params.hostname, params.baseDomain);

  if (isApex) {
    return params.apexRoutingStatus === VerificationStatus.VERIFIED;
  }

  if (params.onboardingMode === DomainOnboardingMode.EXACT_HOSTS) {
    return false;
  }

  return params.wildcardRoutingStatus === VerificationStatus.VERIFIED;
}

export function getBindingActivationSource(params: {
  hostname: string;
  baseDomain: string;
  onboardingMode: DomainOnboardingMode;
  wildcardRoutingStatus: VerificationStatus;
}): 'DOMAIN_APEX' | 'DOMAIN_WILDCARD' | 'EXACT_HOST' {
  if (isApexHostname(params.hostname, params.baseDomain)) {
    return 'DOMAIN_APEX';
  }

  if (
    params.onboardingMode !== DomainOnboardingMode.EXACT_HOSTS &&
    params.wildcardRoutingStatus === VerificationStatus.VERIFIED
  ) {
    return 'DOMAIN_WILDCARD';
  }

  return 'EXACT_HOST';
}

export function hasIngressTargets(ingress: IngressTargets): boolean {
  return (
    Boolean(ingress.canonicalTargetHost) ||
    ingress.ipv4Addresses.length > 0 ||
    ingress.ipv6Addresses.length > 0
  );
}

export function hasApexTargets(ingress: IngressTargets): boolean {
  return ingress.ipv4Addresses.length > 0 || ingress.ipv6Addresses.length > 0;
}

export function requiresWildcardRouting(
  onboardingMode: DomainOnboardingMode
): boolean {
  return onboardingMode !== DomainOnboardingMode.EXACT_HOSTS;
}

export function supportsHttpRouting(method: DomainRoutingMethod): boolean {
  return method === 'HTTP_WELL_KNOWN';
}
