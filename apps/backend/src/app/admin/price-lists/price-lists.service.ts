import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@org/prisma/client';
import {
  AdminPriceListDetailPrismaQuery,
  AdminPriceListListPrismaQuery,
  type AdminPriceListDetailPrismaType,
  type AdminPriceListListPrismaType,
} from '@org/types/admin/pricing';
import type { FilterCondition } from '@org/types/data-query';
import type { PaginatedResponse } from '@org/types/pagination';
import { buildPrismaQuery } from '../../../core/utils/prisma-query-builder';
import { PrismaService } from '../../prisma/prisma.service';
import type { PriceListQueryDTO } from './dto';

@Injectable()
export class PriceListsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPriceLists(
    query: PriceListQueryDTO
  ): Promise<PaginatedResponse<AdminPriceListListPrismaType>> {
    const { page, limit, filters, sort } = query;

    const { where, orderBy, skip, take } = buildPrismaQuery({
      page,
      limit,
      filters: filters as Record<string, FilterCondition> | undefined,
      sort,
      defaultSort: { field: 'createdAt', order: 'desc' },
    });

    const [items, total] = await Promise.all([
      this.prisma.priceList.findMany({
        where: where as Prisma.PriceListWhereInput,
        orderBy: orderBy as
          | Prisma.PriceListOrderByWithRelationInput
          | Prisma.PriceListOrderByWithRelationInput[],
        skip,
        take,
        include: AdminPriceListListPrismaQuery,
      }),
      this.prisma.priceList.count({
        where: where as Prisma.PriceListWhereInput,
      }),
    ]);

    return {
      data: items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async *iteratePriceLists(opts: {
    where: Prisma.PriceListWhereInput;
    orderBy:
      | Prisma.PriceListOrderByWithRelationInput
      | Prisma.PriceListOrderByWithRelationInput[];
    batchSize: number;
  }): AsyncGenerator<AdminPriceListListPrismaType[]> {
    let cursor: string | undefined;

    while (true) {
      const batch = await this.prisma.priceList.findMany({
        where: opts.where,
        orderBy: opts.orderBy,
        take: opts.batchSize,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        include: AdminPriceListListPrismaQuery,
      });

      if (batch.length === 0) break;

      yield batch;
      cursor = batch[batch.length - 1].id;

      if (batch.length < opts.batchSize) break;
    }
  }

  async getPriceListById(id: string): Promise<AdminPriceListDetailPrismaType> {
    const priceList = await this.prisma.priceList.findUnique({
      where: { id },
      include: AdminPriceListDetailPrismaQuery,
    });

    if (!priceList) {
      throw new NotFoundException('backend.errors.price_list_not_found');
    }

    return priceList;
  }
}
