import { Injectable } from '@nestjs/common';
import { type Prisma, type StockMovementStatus } from '@org/prisma/client';
import { PrismaService } from './prisma.service';

type PrismaTx = Prisma.TransactionClient;

@Injectable()
export class StockMovementStatusHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  private getClient(tx?: PrismaTx) {
    return tx ?? this.prisma;
  }

  async recordInitialStatus(args: {
    stockMovementGroupId: string;
    status: StockMovementStatus;
    actorUserId?: string | null;
    reason?: string | null;
    metadata?: Prisma.InputJsonValue;
    tx?: PrismaTx;
  }) {
    const {
      stockMovementGroupId,
      status,
      actorUserId = null,
      reason = null,
      metadata,
      tx,
    } = args;

    return this.getClient(tx).stockMovementGroupStatusEvent.create({
      data: {
        stockMovementGroupId,
        fromStatus: null,
        toStatus: status,
        actorUserId,
        reason,
        metadata,
      },
    });
  }

  async recordTransition(args: {
    stockMovementGroupId: string;
    fromStatus: StockMovementStatus | null;
    toStatus: StockMovementStatus;
    actorUserId?: string | null;
    reason?: string | null;
    metadata?: Prisma.InputJsonValue;
    tx?: PrismaTx;
  }) {
    const {
      stockMovementGroupId,
      fromStatus,
      toStatus,
      actorUserId = null,
      reason = null,
      metadata,
      tx,
    } = args;

    return this.getClient(tx).stockMovementGroupStatusEvent.create({
      data: {
        stockMovementGroupId,
        fromStatus,
        toStatus,
        actorUserId,
        reason,
        metadata,
      },
    });
  }
}
