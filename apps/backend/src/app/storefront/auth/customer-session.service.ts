import { Injectable } from '@nestjs/common';
import {
  CUSTOMER_MAX_ACTIVE_SESSIONS,
  CUSTOMER_SESSION_EXPIRY_DAYS,
} from '@org/constants/auth-constants';
import { Prisma, type SessionRevokeReason } from '@org/prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { CustomerRequestMetadata } from './interfaces';

@Injectable()
export class CustomerSessionService {
  constructor(private readonly prisma: PrismaService) {}

  async createSession(params: {
    customerId: string;
    deviceId?: string;
    metadata: CustomerRequestMetadata;
  }) {
    const sessionToken = randomBytes(32).toString('base64url');
    const expiresAt = new Date(
      Date.now() + CUSTOMER_SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    );

    const activeSessions = await this.prisma.customerSession.findMany({
      where: { customerId: params.customerId, isActive: true },
      orderBy: { createdAt: 'asc' },
    });

    if (activeSessions.length >= CUSTOMER_MAX_ACTIVE_SESSIONS) {
      const sessionsToRevoke = activeSessions.slice(
        0,
        activeSessions.length - CUSTOMER_MAX_ACTIVE_SESSIONS + 1,
      );
      await this.prisma.customerSession.updateMany({
        where: { id: { in: sessionsToRevoke.map((s) => s.id) } },
        data: {
          isActive: false,
          revokedAt: new Date(),
          revokeReason: 'EXPIRED',
        },
      });
    }

    return this.prisma.customerSession.create({
      data: {
        customerId: params.customerId,
        sessionToken,
        ipAddress: params.metadata.ipAddress,
        userAgent: params.metadata.userAgent,
        browserName: params.metadata.browserName,
        browserVersion: params.metadata.browserVersion,
        osName: params.metadata.osName,
        osVersion: params.metadata.osVersion,
        deviceType: params.metadata.deviceType,
        deviceId: params.deviceId,
        expiresAt,
      },
    });
  }

  async getActiveSessions(customerId: string) {
    return this.prisma.customerSession.findMany({
      where: { customerId, isActive: true },
      orderBy: { lastActivityAt: 'desc' },
    });
  }

  async revokeSession(sessionId: string, reason: SessionRevokeReason) {
    return this.prisma.customerSession.update({
      where: { id: sessionId },
      data: {
        isActive: false,
        revokedAt: new Date(),
        revokeReason: reason,
      },
    });
  }

  async revokeAllSessions(
    customerId: string,
    reason: SessionRevokeReason,
    excludeSessionId?: string,
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.customerSession.updateMany({
      where: {
        customerId,
        isActive: true,
        ...(excludeSessionId ? { id: { not: excludeSessionId } } : {}),
      },
      data: {
        isActive: false,
        revokedAt: new Date(),
        revokeReason: reason,
      },
    });
  }

  async updateSessionActivity(sessionId: string) {
    return this.prisma.customerSession.update({
      where: { id: sessionId },
      data: { lastActivityAt: new Date() },
    });
  }
}
