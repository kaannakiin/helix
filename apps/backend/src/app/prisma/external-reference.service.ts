import { Injectable } from '@nestjs/common';
import {
  type ExternalEntityType,
  type Prisma,
  type SourceSystem,
} from '@org/prisma/client';
import { PrismaService } from './prisma.service';

type PrismaTx = Prisma.TransactionClient;

@Injectable()
export class ExternalReferenceService {
  constructor(private readonly prisma: PrismaService) {}

  private getClient(tx?: PrismaTx) {
    return tx ?? this.prisma;
  }

  async upsert(args: {
    entityType: ExternalEntityType;
    entityId: string;
    sourceSystem: SourceSystem;
    externalRef: string;
    externalSubRef?: string | null;
    payloadHash?: string | null;
    metadata?: Prisma.InputJsonValue;
    lastSyncedAt?: Date | null;
    tx?: PrismaTx;
  }) {
    const {
      entityType,
      entityId,
      sourceSystem,
      externalRef,
      externalSubRef = '',
      payloadHash = null,
      metadata,
      lastSyncedAt = null,
      tx,
    } = args;
    const normalizedExternalSubRef = externalSubRef ?? '';

    const db = this.getClient(tx);

    return db.externalReference.upsert({
      where: {
        sourceSystem_entityType_entityId: {
          sourceSystem,
          entityType,
          entityId,
        },
      },
      create: {
        entityType,
        entityId,
        sourceSystem,
        externalRef,
        externalSubRef: normalizedExternalSubRef,
        payloadHash,
        metadata,
        lastSyncedAt,
      },
      update: {
        externalRef,
        externalSubRef: normalizedExternalSubRef,
        payloadHash,
        metadata,
        lastSyncedAt,
      },
    });
  }

  async resolveByExternalRef(args: {
    sourceSystem: SourceSystem;
    entityType: ExternalEntityType;
    externalRef: string;
    externalSubRef?: string | null;
    tx?: PrismaTx;
  }) {
    const {
      sourceSystem,
      entityType,
      externalRef,
      externalSubRef = '',
      tx,
    } = args;
    const normalizedExternalSubRef = externalSubRef ?? '';

    return this.getClient(tx).externalReference.findUnique({
      where: {
        sourceSystem_entityType_externalRef_externalSubRef: {
          sourceSystem,
          entityType,
          externalRef,
          externalSubRef: normalizedExternalSubRef,
        },
      },
    });
  }
}
