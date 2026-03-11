import { Injectable } from '@nestjs/common';
import type { Locale, Prisma } from '@org/prisma/client';
import type { AuthorizationContext } from '@org/types/authorization';
import type { LookupItem } from '@org/schemas/admin/common';
import {
  adminWarehouseListPrismaQuery,
  type AdminWarehouseListPrismaType,
} from '@org/types/admin/warehouses';
import type { FilterCondition } from '@org/types/data-query';
import type { PaginatedResponse } from '@org/types/pagination';
import { buildPrismaQuery } from '../../../core/utils/prisma-query-builder';
import { PrismaService } from '../../prisma/prisma.service';
import type { WarehouseQueryDTO } from './dto';

@Injectable()
export class WarehousesService {
  constructor(private readonly prisma: PrismaService) {}

  async getWarehouses(
    query: WarehouseQueryDTO,
    locale: Locale,
    authzCtx: AuthorizationContext
  ): Promise<PaginatedResponse<AdminWarehouseListPrismaType>> {
    const { page, limit, filters, sort } = query;

    const { where, orderBy, skip, take } = buildPrismaQuery({
      page,
      limit,
      filters: filters as Record<string, FilterCondition> | undefined,
      sort,
      defaultSort: { field: 'createdAt', order: 'desc' },
    });

    const typedWhere = where as Prisma.WarehouseWhereInput;
    if (!authzCtx.allStores) {
      const storeCondition = { storeId: { in: authzCtx.storeIds } };
      typedWhere.AND = [...(Array.isArray(typedWhere.AND) ? typedWhere.AND : typedWhere.AND ? [typedWhere.AND] : []), storeCondition];
    }

    const [items, total] = await Promise.all([
      this.prisma.warehouse.findMany({
        where: typedWhere,
        orderBy: orderBy as
          | Prisma.WarehouseOrderByWithRelationInput
          | Prisma.WarehouseOrderByWithRelationInput[],
        skip,
        take,
        include: adminWarehouseListPrismaQuery(locale),
      }),
      this.prisma.warehouse.count({
        where: typedWhere,
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

  async *iterateWarehouses(opts: {
    where: Prisma.WarehouseWhereInput;
    orderBy:
      | Prisma.WarehouseOrderByWithRelationInput
      | Prisma.WarehouseOrderByWithRelationInput[];
    batchSize: number;
    locale: Locale;
  }): AsyncGenerator<AdminWarehouseListPrismaType[]> {
    const { locale } = opts;
    let cursor: string | undefined;

    while (true) {
      const batch = await this.prisma.warehouse.findMany({
        where: opts.where,
        orderBy: opts.orderBy,
        take: opts.batchSize,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        include: adminWarehouseListPrismaQuery(locale),
      });

      if (batch.length === 0) break;

      yield batch;
      cursor = batch[batch.length - 1].id;

      if (batch.length < opts.batchSize) break;
    }
  }

  async lookup(opts: {
    q?: string;
    ids?: string[];
    limit: number;
    page: number;
    lang: Locale;
    authzCtx: AuthorizationContext;
  }): Promise<LookupItem[] | PaginatedResponse<LookupItem>> {
    const { q, ids, limit, page, lang, authzCtx } = opts;

    const storeFilter: Prisma.WarehouseWhereInput = !authzCtx.allStores
      ? { storeId: { in: authzCtx.storeIds } }
      : {};

    if (ids?.length) {
      const warehouses = await this.prisma.warehouse.findMany({
        where: { id: { in: ids }, ...storeFilter },
        include: {
          translations: { where: { locale: lang } },
        },
      });

      return warehouses.map((w) => ({
        id: w.id,
        label: w.translations[0]?.name ?? w.code,
        slug: w.slug,
      }));
    }

    const skip = (page - 1) * limit;

    const where: Prisma.WarehouseWhereInput = {
      status: 'ACTIVE',
      ...storeFilter,
      ...(q
        ? {
            translations: {
              some: {
                locale: lang,
                name: { contains: q, mode: 'insensitive' as const },
              },
            },
          }
        : {}),
    };

    const [warehouses, total] = await Promise.all([
      this.prisma.warehouse.findMany({
        where,
        skip,
        take: limit,
        orderBy: { sortOrder: 'asc' },
        include: {
          translations: { where: { locale: lang } },
        },
      }),
      this.prisma.warehouse.count({ where }),
    ]);

    return {
      data: warehouses.map((w) => ({
        id: w.id,
        label: w.translations[0]?.name ?? w.code,
        slug: w.slug,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
