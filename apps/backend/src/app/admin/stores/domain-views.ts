import type {
  DomainOnboardingMode,
  DomainOwnershipMethod,
  DomainRoutingMethod,
  DomainSpace,
  DomainSpaceStatus,
  HostBindingStatus,
  HostBindingType,
  InstallationIngress,
  Store,
  StoreHostBinding,
  VerificationStatus,
} from '@org/prisma/client';
import type {
  DnsInstruction,
  DomainSpaceView,
  HttpVerificationDescriptor,
  StoreHostBindingView,
  VerificationStepView,
} from '@org/schemas/admin/settings';
import {
  buildApexDnsInstructions,
  buildExactHostDnsInstructions,
  buildOwnershipDnsInstruction,
  buildRoutingChallengeUrl,
  buildWildcardDnsInstructions,
  getBindingActivationSource,
  normalizeHostname,
  requiresWildcardRouting,
  type IngressTargets,
} from './domain-utils.js';

interface DomainSpaceWithRelations extends DomainSpace {
  installation: {
    ingress: InstallationIngress | null;
  };
  hostBindings: Array<Pick<StoreHostBinding, 'id' | 'hostname' | 'status' | 'storeId'>>;
}

interface StoreHostBindingWithRelations extends StoreHostBinding {
  store: Pick<Store, 'id' | 'name'>;
  domainSpace: DomainSpace & {
    installation: {
      ingress: InstallationIngress | null;
    };
  };
}

function toIngressTargets(ingress: InstallationIngress | null): IngressTargets {
  return {
    canonicalTargetHost: ingress?.canonicalTargetHost
      ? normalizeHostname(ingress.canonicalTargetHost)
      : null,
    ipv4Addresses: ingress?.ipv4Addresses ?? [],
    ipv6Addresses: ingress?.ipv6Addresses ?? [],
  };
}

function toHttpDescriptor(
  hostname: string,
  method: DomainRoutingMethod,
  token: string | null | undefined
): HttpVerificationDescriptor | null {
  if (method !== 'HTTP_WELL_KNOWN' || !token) {
    return null;
  }

  return {
    url: buildRoutingChallengeUrl(hostname),
    expectedBody: token,
  };
}

function buildOwnershipView(space: DomainSpace): VerificationStepView {
  return {
    method: space.ownershipMethod as DomainOwnershipMethod,
    status: space.ownershipStatus as VerificationStatus,
    verifiedAt: space.ownershipVerifiedAt,
    lastError: space.ownershipLastError,
    record:
      space.ownershipMethod === 'TXT_TOKEN' && space.ownershipRecordValue
        ? {
            ...buildOwnershipDnsInstruction(space.ownershipRecordValue),
            name: space.ownershipRecordName ?? '_helix-verify',
          }
        : undefined,
  };
}

function buildApexRoutingView(
  space: DomainSpace,
  ingressTargets: IngressTargets
): VerificationStepView {
  return {
    method: space.apexRoutingMethod as DomainRoutingMethod,
    status: space.apexRoutingStatus as VerificationStatus,
    verifiedAt: space.apexVerifiedAt,
    lastError: space.apexRoutingLastError,
    dns: buildApexDnsInstructions(ingressTargets),
    http: toHttpDescriptor(
      space.baseDomain,
      space.apexRoutingMethod,
      space.apexChallengeToken
    ),
  };
}

function buildWildcardRoutingView(
  space: DomainSpace,
  ingressTargets: IngressTargets
): VerificationStepView {
  return {
    method: space.wildcardRoutingMethod as DomainRoutingMethod,
    status: space.wildcardRoutingStatus as VerificationStatus,
    verifiedAt: space.wildcardVerifiedAt,
    lastError: space.wildcardRoutingLastError,
    probeHost: space.wildcardProbeHost,
    dns: requiresWildcardRouting(space.onboardingMode as DomainOnboardingMode)
      ? buildWildcardDnsInstructions(space.baseDomain, ingressTargets)
      : [],
    http:
      requiresWildcardRouting(space.onboardingMode as DomainOnboardingMode) &&
      space.wildcardProbeHost
        ? toHttpDescriptor(
            space.wildcardProbeHost,
            space.wildcardRoutingMethod,
            space.wildcardChallengeToken
          )
        : null,
  };
}

export function toDomainSpaceView(
  space: DomainSpaceWithRelations
): DomainSpaceView {
  const ingressTargets = toIngressTargets(space.installation.ingress);

  return {
    id: space.id,
    installationId: space.installationId,
    baseDomain: space.baseDomain,
    onboardingMode: space.onboardingMode,
    status: space.status as DomainSpaceStatus,
    createdAt: space.createdAt,
    updatedAt: space.updatedAt,
    hostBindings: space.hostBindings.map((binding) => ({
      id: binding.id,
      hostname: binding.hostname,
      status: binding.status as HostBindingStatus,
      storeId: binding.storeId,
    })),
    ownership: buildOwnershipView(space),
    routing: {
      apex: buildApexRoutingView(space, ingressTargets),
      wildcard: buildWildcardRoutingView(space, ingressTargets),
    },
    capabilities: {
      canBindApexNow: space.apexRoutingStatus === 'VERIFIED',
      canAutoActivateSubdomains:
        requiresWildcardRouting(space.onboardingMode as DomainOnboardingMode) &&
        space.wildcardRoutingStatus === 'VERIFIED',
    },
  };
}

export function toStoreHostBindingView(
  binding: StoreHostBindingWithRelations
): StoreHostBindingView {
  const ingressTargets = toIngressTargets(binding.domainSpace.installation.ingress);

  return {
    id: binding.id,
    storeId: binding.storeId,
    domainSpaceId: binding.domainSpaceId,
    hostname: binding.hostname,
    type: binding.type as HostBindingType,
    status: binding.status as HostBindingStatus,
    activationSource: getBindingActivationSource({
      hostname: binding.hostname,
      baseDomain: binding.domainSpace.baseDomain,
      onboardingMode: binding.domainSpace.onboardingMode,
      wildcardRoutingStatus: binding.domainSpace.wildcardRoutingStatus,
    }),
    activatedAt: binding.activatedAt,
    createdAt: binding.createdAt,
    updatedAt: binding.updatedAt,
    routing: {
      method: binding.routingMethod as DomainRoutingMethod,
      status: binding.routingStatus as VerificationStatus,
      verifiedAt: binding.routingVerifiedAt,
      lastError: binding.routingLastError,
      dns: buildExactHostDnsInstructions(
        binding.hostname,
        binding.domainSpace.baseDomain,
        ingressTargets
      ) as DnsInstruction[],
      http: toHttpDescriptor(
        binding.hostname,
        binding.routingMethod,
        binding.challengeToken
      ),
    },
    store: {
      id: binding.store.id,
      name: binding.store.name,
    },
    domainSpace: {
      id: binding.domainSpace.id,
      baseDomain: binding.domainSpace.baseDomain,
      onboardingMode: binding.domainSpace.onboardingMode,
      status: binding.domainSpace.status,
    },
  };
}
