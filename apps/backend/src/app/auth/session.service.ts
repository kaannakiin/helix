import { Injectable } from '@nestjs/common';
import { MAX_ACTIVE_SESSIONS, SESSION_EXPIRY_DAYS } from '@org/constants';
import { Prisma, type SessionRevokeReason } from '@org/prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { RequestMetadata } from './interfaces';

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  async createSession(params: {
    userId: string;
    deviceId?: string;
    metadata: RequestMetadata;
  }) {
    const sessionToken = randomBytes(32).toString('base64url');
    const expiresAt = new Date(
      Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    );

    const activeSessions = await this.prisma.session.findMany({
      where: { userId: params.userId, isActive: true },
      orderBy: { createdAt: 'asc' },
    });

    if (activeSessions.length >= MAX_ACTIVE_SESSIONS) {
      const sessionsToRevoke = activeSessions.slice(
        0,
        activeSessions.length - MAX_ACTIVE_SESSIONS + 1
      );
      await this.prisma.session.updateMany({
        where: { id: { in: sessionsToRevoke.map((s) => s.id) } },
        data: {
          isActive: false,
          revokedAt: new Date(),
          revokeReason: 'EXPIRED',
        },
      });
    }

    return this.prisma.session.create({
      data: {
        userId: params.userId,
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

  async getActiveSessions(userId: string) {
    return this.prisma.session.findMany({
      where: { userId, isActive: true },
      orderBy: { lastActivityAt: 'desc' },
    });
  }

  async revokeSession(sessionId: string, reason: SessionRevokeReason) {
    return this.prisma.session.update({
      where: { id: sessionId },
      data: {
        isActive: false,
        revokedAt: new Date(),
        revokeReason: reason,
      },
    });
  }

  async revokeAllSessions(
    userId: string,
    reason: SessionRevokeReason,
    excludeSessionId?: string
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.session.updateMany({
      where: {
        userId,
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
    return this.prisma.session.update({
      where: { id: sessionId },
      data: { lastActivityAt: new Date() },
    });
  }
}
