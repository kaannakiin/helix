import type { DeviceType } from '@org/prisma/client';
import type { TokenPayload } from '@org/types/token';
import type { Request } from 'express';
import type { RefreshTokenPayload } from '../token.service';

export interface AuthenticatedRequest extends Request {
  user: TokenPayload;
}

export interface ValidatedUser {
  id: string;
  name: string;
  surname: string;
  email: string | null;
  phone: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
}

export interface RefreshTokenContext {
  user: RefreshTokenPayload;
  refreshToken: string;
  sessionId: string;
  family: string;
  tokenId: string;
}

export interface AuthenticatedRefreshRequest extends Request {
  user: RefreshTokenContext;
}

export interface RequestMetadata {
  ipAddress: string;
  userAgent: string;
  browserName?: string;
  browserVersion?: string;
  osName?: string;
  osVersion?: string;
  deviceType: DeviceType;
  fingerprint: string;
}

