import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { CustomerRequestMetadata } from './interfaces';

@Injectable()
export class CustomerDeviceService {
  constructor(private readonly prisma: PrismaService) {}

  hashFingerprint(fingerprint: string): string {
    return createHash('sha256').update(fingerprint).digest('hex');
  }

  async findOrCreateDevice(params: {
    customerId: string;
    metadata: CustomerRequestMetadata;
  }) {
    const hashedFingerprint = this.hashFingerprint(params.metadata.fingerprint);

    return this.prisma.customerDevice.upsert({
      where: {
        customerId_fingerprint: {
          customerId: params.customerId,
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
        customerId: params.customerId,
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
}
