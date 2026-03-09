import type { DeviceType, OAuthProvider } from '@org/prisma/client';
import type {
  CustomerRefreshTokenPayload,
  CustomerTokenPayload,
} from '@org/types/storefront';
import type { Request } from 'express';

export interface ValidatedCustomer {
  id: string;
  storeId: string;
  name: string;
  surname: string;
  email: string | null;
  phone: string | null;
}

export interface CustomerRefreshTokenContext {
  user: CustomerRefreshTokenPayload;
  refreshToken: string;
  sessionId: string;
  family: string;
  tokenId: string;
}

export interface AuthenticatedCustomerRequest extends Request {
  user: CustomerTokenPayload;
}

export interface AuthenticatedCustomerRefreshRequest extends Request {
  user: CustomerRefreshTokenContext;
}

export interface CustomerOAuthProfile {
  provider: OAuthProvider;
  providerAccountId: string;
  email: string | null;
  name: string;
  surname: string;
  avatar: string | null;
  emailVerified: boolean;
  accessToken: string;
  refreshToken: string | null;
}

export interface CustomerRequestMetadata {
  ipAddress: string;
  userAgent: string;
  browserName?: string;
  browserVersion?: string;
  osName?: string;
  osVersion?: string;
  deviceType: DeviceType;
  fingerprint: string;
}
