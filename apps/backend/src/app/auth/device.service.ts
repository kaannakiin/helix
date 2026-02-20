import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { RequestMetadata } from './interfaces';

@Injectable()
export class DeviceService {
  constructor(private readonly prisma: PrismaService) {}

  hashFingerprint(fingerprint: string): string {
    return createHash('sha256').update(fingerprint).digest('hex');
  }

  async findOrCreateDevice(params: {
    userId: string;
    metadata: RequestMetadata;
  }) {
    const hashedFingerprint = this.hashFingerprint(params.metadata.fingerprint);

    return this.prisma.device.upsert({
      where: {
        userId_fingerprint: {
          userId: params.userId,
          fingerprint: hashedFingerprint,
        },
      },
      update: {
        lastSeenAt: new Date(),
        browserName: params.metadata.browserName,
        browserVersion: params.metadata.browserVersion,
        osName: params.metadata.osName,
        osVersion: params.metadata.osVersion,
      },
      create: {
        userId: params.userId,
        fingerprint: hashedFingerprint,
        deviceType: params.metadata.deviceType,
        browserName: params.metadata.browserName,
        browserVersion: params.metadata.browserVersion,
        osName: params.metadata.osName,
        osVersion: params.metadata.osVersion,
        deviceName: `${params.metadata.browserName ?? 'Unknown'} on ${
          params.metadata.osName ?? 'Unknown'
        }`,
      },
    });
  }

  async getUserDevices(userId: string) {
    return this.prisma.device.findMany({
      where: { userId },
      orderBy: { lastSeenAt: 'desc' },
    });
  }

  async toggleTrust(deviceId: string, isTrusted: boolean) {
    return this.prisma.device.update({
      where: { id: deviceId },
      data: { isTrusted },
    });
  }

  async deleteDevice(deviceId: string) {
    // Revoke all sessions for this device first
    await this.prisma.session.updateMany({
      where: { deviceId, isActive: true },
      data: {
        isActive: false,
        revokedAt: new Date(),
        revokeReason: 'USER_REVOKED',
      },
    });

    return this.prisma.device.delete({
      where: { id: deviceId },
    });
  }
}
