import { Injectable } from '@nestjs/common';
import {
  DocumentNumberType,
  type Prisma,
  type NumberSeries,
} from '@org/prisma/client';
import { PrismaService } from './prisma.service';

type PrismaTx = Prisma.TransactionClient;

@Injectable()
export class DocumentNumberService {
  constructor(private readonly prisma: PrismaService) {}

  private getClient(tx?: PrismaTx) {
    return tx ?? this.prisma;
  }

  buildStoreScopeKey(storeId: string) {
    return `store:${storeId}`;
  }

  async nextStockMovementGroupNumber(args: {
    storeId: string;
    date?: Date;
    tx?: PrismaTx;
  }) {
    const { storeId, date = new Date(), tx } = args;
    const year = date.getUTCFullYear();
    const prefix = 'SM';
    const scopeKey = this.buildStoreScopeKey(storeId);

    const reserve = async (db: PrismaTx | PrismaService) => {
      const seedValue = await this.resolveSeedValue({
        storeId,
        year,
        prefix,
        tx: db,
      });

      await db.numberSeries.upsert({
        where: {
          documentType_scopeKey_year: {
            documentType: DocumentNumberType.STOCK_MOVEMENT_GROUP,
            scopeKey,
            year,
          },
        },
        create: {
          documentType: DocumentNumberType.STOCK_MOVEMENT_GROUP,
          scopeKey,
          year,
          lastValue: seedValue,
        },
        update: {},
      });

      const series = await db.numberSeries.update({
        where: {
          documentType_scopeKey_year: {
            documentType: DocumentNumberType.STOCK_MOVEMENT_GROUP,
            scopeKey,
            year,
          },
        },
        data: {
          lastValue: { increment: 1 },
        },
      });

      return this.formatNumber({
        prefix,
        year,
        value: series.lastValue,
      });
    };

    if (tx) {
      return reserve(tx);
    }

    return this.prisma.$transaction((trx) => reserve(trx));
  }

  private async resolveSeedValue(args: {
    storeId: string;
    year: number;
    prefix: string;
    tx?: PrismaTx | PrismaService;
  }) {
    const { storeId, year, prefix, tx } = args;
    const db = this.getClient(tx);
    const series = await db.numberSeries.findUnique({
      where: {
        documentType_scopeKey_year: {
          documentType: DocumentNumberType.STOCK_MOVEMENT_GROUP,
          scopeKey: this.buildStoreScopeKey(storeId),
          year,
        },
      },
    });

    if (series) return series.lastValue;

    const formattedPrefix = `${prefix}-${year}-`;
    const latestDocument = await db.stockMovementGroup.findFirst({
      where: {
        documentNumber: { startsWith: formattedPrefix },
        OR: [
          { sourceWarehouse: { storeId } },
          { destWarehouse: { storeId } },
        ],
      },
      orderBy: { documentNumber: 'desc' },
      select: { documentNumber: true },
    });

    if (!latestDocument) return 0;

    return this.parseTrailingSequence(latestDocument.documentNumber);
  }

  private parseTrailingSequence(documentNumber: string) {
    const match = documentNumber.match(/-(\d+)$/);
    return match ? Number.parseInt(match[1], 10) : 0;
  }

  private formatNumber(args: {
    prefix: string;
    year: number;
    value: number;
  }) {
    const { prefix, year, value } = args;
    return `${prefix}-${year}-${value.toString().padStart(6, '0')}`;
  }
}
