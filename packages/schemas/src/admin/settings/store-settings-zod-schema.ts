import { TIMEZONES } from '@org/constants/timezone-constants';
import {
  BusinessModel,
  CurrencyCode,
  DomainOnboardingMode,
  DomainOwnershipMethod,
  DomainRoutingMethod,
  DomainSpaceStatus,
  HostBindingStatus,
  HostBindingType,
  Locale,
  StoreStatus,
  VerificationStatus,
} from '@org/prisma/browser';
import { z } from 'zod';
import { V } from '../../common/validation-keys.js';

const domainPattern =
  /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;
const exactHostnamePattern =
  /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;
const hostnamePattern =
  /^(?=.{1,253}$)(?:\*\.)?(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

const optionalHostnameSchema = z
  .string()
  .transform((value) => value.trim().toLowerCase())
  .transform((value) => value || undefined)
  .pipe(
    z
      .string({ error: V.HOSTNAME_INVALID })
      .regex(exactHostnamePattern, { error: V.HOSTNAME_INVALID })
      .optional()
  );

const exactHostnameSchema = z
  .string()
  .transform((value) => value.trim().toLowerCase())
  .pipe(
    z
      .string({ error: V.HOSTNAME_INVALID })
      .min(1, { error: V.REQUIRED })
      .regex(exactHostnamePattern, { error: V.HOSTNAME_INVALID })
  );

const hostnameSchema = z
  .string()
  .transform((value) => value.trim().toLowerCase())
  .pipe(
    z
      .string({ error: V.HOSTNAME_INVALID })
      .min(1, { error: V.REQUIRED })
      .regex(hostnamePattern, { error: V.HOSTNAME_INVALID })
  );

const baseDomainSchema = z
  .string()
  .transform((value) => value.trim().toLowerCase())
  .pipe(
    z
      .string({ error: V.DOMAIN_INVALID })
      .min(1, { error: V.REQUIRED })
      .regex(domainPattern, { error: V.DOMAIN_INVALID })
  );

const ipv4Schema = z
  .string()
  .transform((value) => value.trim())
  .pipe(z.ipv4({ error: V.IPV4_INVALID }));

const ipv6Schema = z
  .string()
  .transform((value) => value.trim())
  .pipe(z.ipv6({ error: V.IPV6_INVALID }));

export const InstallationIngressSchema = z
  .object({
    canonicalTargetHost: optionalHostnameSchema,
    ipv4Addresses: z.array(ipv4Schema).default([]),
    ipv6Addresses: z.array(ipv6Schema).default([]),
  })
  .check(({ issues, value }) => {
    if (
      value.canonicalTargetHost ||
      value.ipv4Addresses.length > 0 ||
      value.ipv6Addresses.length > 0
    ) {
      return;
    }

    issues.push({
      code: 'custom',
      input: value,
      message: V.INGRESS_TARGET_REQUIRED,
      path: ['canonicalTargetHost'],
    });
  });

export const PlatformInstallationSchema = z.object({
  name: z
    .string({ error: V.NAME_REQUIRED })
    .trim()
    .min(1, { error: V.NAME_REQUIRED })
    .max(255),
  portalHostname: exactHostnameSchema,
  tlsAskSecret: z
    .string()
    .transform((value) => value.trim())
    .transform((value) => value || undefined)
    .pipe(z.string().min(8).max(255).optional()),
  defaultLocale: z.enum(Locale, { error: V.LOCALE_REQUIRED }).default('TR'),
  currency: z.enum(CurrencyCode, { error: V.REQUIRED }).default('TRY'),
  timezone: z
    .enum(TIMEZONES as unknown as [string, ...string[]], {
      error: V.TIMEZONE_INVALID,
    })
    .default('Europe/Istanbul'),
  ingress: InstallationIngressSchema,
});

export const DomainSpaceSchema = z.object({
  baseDomain: baseDomainSchema,
  onboardingMode: z.enum(DomainOnboardingMode, { error: V.REQUIRED }),
  ownershipMethod: z
    .enum(DomainOwnershipMethod, { error: V.REQUIRED })
    .default('TXT_TOKEN'),
  apexRoutingMethod: z
    .enum(DomainRoutingMethod, { error: V.REQUIRED })
    .default('HTTP_WELL_KNOWN'),
  wildcardRoutingMethod: z
    .enum(DomainRoutingMethod, { error: V.REQUIRED })
    .default('HTTP_WELL_KNOWN'),
});

export const StoreHostBindingSchema = z.object({
  storeId: z.cuid(),
  domainSpaceId: z.cuid(),
  hostname: exactHostnameSchema,
  type: z.enum(HostBindingType, { error: V.REQUIRED }).default('PRIMARY'),
  routingMethod: z
    .enum(DomainRoutingMethod, { error: V.REQUIRED })
    .default('HTTP_WELL_KNOWN'),
});

export const CreateStoreSchema = z.object({
  name: z
    .string({ error: V.NAME_REQUIRED })
    .trim()
    .min(1, { error: V.NAME_REQUIRED })
    .max(255),
  slug: z
    .string({ error: V.REQUIRED })
    .trim()
    .min(1, { error: V.REQUIRED })
    .max(100)
    .regex(/^[a-z0-9-]+$/, { error: V.SLUG_PATTERN }),
  businessModel: z.enum(BusinessModel, { error: V.REQUIRED }),
  status: z.enum(StoreStatus, { error: V.REQUIRED }),
  defaultLocale: z.enum(Locale, { error: V.LOCALE_REQUIRED }),
  currency: z.enum(CurrencyCode, { error: V.REQUIRED }),
  timezone: z
    .enum(TIMEZONES as unknown as [string, ...string[]], {
      error: V.TIMEZONE_INVALID,
    })
    .nullish(),
  description: z.string().nullish(),
  logoUrl: z.string().nullish(),
});

export const UpdateStoreSchema = CreateStoreSchema.partial();

export type CreateStoreInput = z.input<typeof CreateStoreSchema>;
export type CreateStoreOutput = z.output<typeof CreateStoreSchema>;

export type UpdateStoreInput = z.input<typeof UpdateStoreSchema>;
export type UpdateStoreOutput = z.output<typeof UpdateStoreSchema>;

export type PlatformInstallationInput = z.input<
  typeof PlatformInstallationSchema
>;
export type PlatformInstallationOutput = z.output<
  typeof PlatformInstallationSchema
>;

export type DomainSpaceInput = z.input<typeof DomainSpaceSchema>;
export type DomainSpaceOutput = z.output<typeof DomainSpaceSchema>;

export type StoreHostBindingInput = z.input<typeof StoreHostBindingSchema>;
export type StoreHostBindingOutput = z.output<typeof StoreHostBindingSchema>;

export interface DnsInstruction {
  type: 'A' | 'AAAA' | 'CNAME' | 'TXT';
  name: string;
  value: string;
  note?: string;
}

export interface HttpVerificationDescriptor {
  url: string;
  expectedBody: string;
}

export interface VerificationStepView {
  method: DomainOwnershipMethod | DomainRoutingMethod;
  status: VerificationStatus;
  verifiedAt: string | Date | null;
  lastError: string | null;
  record?: DnsInstruction;
  dns?: DnsInstruction[];
  http?: HttpVerificationDescriptor | null;
  probeHost?: string | null;
}

export interface DomainSpaceCapabilitiesView {
  canBindApexNow: boolean;
  canAutoActivateSubdomains: boolean;
}

export interface DomainSpaceView {
  id: string;
  installationId: string;
  baseDomain: string;
  onboardingMode: DomainOnboardingMode;
  status: DomainSpaceStatus;
  createdAt: string | Date;
  updatedAt: string | Date;
  hostBindings: Array<{
    id: string;
    hostname: string;
    status: HostBindingStatus;
    storeId: string;
  }>;
  ownership: VerificationStepView;
  routing: {
    apex: VerificationStepView;
    wildcard: VerificationStepView;
  };
  capabilities: DomainSpaceCapabilitiesView;
}

export interface StoreHostBindingView {
  id: string;
  storeId: string;
  domainSpaceId: string;
  hostname: string;
  type: HostBindingType;
  status: HostBindingStatus;
  activationSource: 'DOMAIN_APEX' | 'DOMAIN_WILDCARD' | 'EXACT_HOST';
  activatedAt: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  routing: VerificationStepView;
  store: {
    id: string;
    name: string;
  };
  domainSpace: {
    id: string;
    baseDomain: string;
    onboardingMode: DomainOnboardingMode;
    status: DomainSpaceStatus;
  };
}
