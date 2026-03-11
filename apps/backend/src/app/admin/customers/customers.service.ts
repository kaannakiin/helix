import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@org/prisma/client';
import type { AuthorizationContext } from '@org/types/authorization';
import {
  AdminCustomerDetailPrismaQuery,
  AdminCustomersPrismaQuery,
  type AdminCustomerDetailPrismaType,
  type AdminCustomersPrismaType,
} from '@org/types/admin/customers';
import type { PaginatedResponse } from '@org/types/pagination';
import { buildPrismaQuery } from '../../../core/utils/prisma-query-builder';
import { PrismaService } from '../../prisma/prisma.service';
import type { CustomerQueryDTO } from './dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async getCustomers(
    query: CustomerQueryDTO,
    authzCtx: AuthorizationContext
  ): Promise<PaginatedResponse<AdminCustomersPrismaType>> {
    const { page, limit, filters, sort, search } = query;

    const { where, orderBy, skip, take } = buildPrismaQuery({
      page,
      limit,
      filters,
      sort,
      search,
      defaultSort: { field: 'createdAt', order: 'desc' },
    });

    const typedWhere = where as Prisma.CustomerWhereInput;
    if (!authzCtx.allStores) {
      const storeCondition = { storeId: { in: authzCtx.storeIds } };
      typedWhere.AND = [...(Array.isArray(typedWhere.AND) ? typedWhere.AND : typedWhere.AND ? [typedWhere.AND] : []), storeCondition];
    }

    const [items, total] = await Promise.all([
      this.prisma.customer.findMany({
        where: typedWhere,
        orderBy: orderBy as
          | Prisma.CustomerOrderByWithRelationInput
          | Prisma.CustomerOrderByWithRelationInput[],
        skip,
        take,
        include: AdminCustomersPrismaQuery,
      }),
      this.prisma.customer.count({ where: typedWhere }),
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

  async *iterateCustomers(opts: {
    where: Prisma.CustomerWhereInput;
    orderBy:
      | Prisma.CustomerOrderByWithRelationInput
      | Prisma.CustomerOrderByWithRelationInput[];
    batchSize: number;
  }): AsyncGenerator<AdminCustomersPrismaType[]> {
    let cursor: string | undefined;

    while (true) {
      const batch = await this.prisma.customer.findMany({
        where: opts.where,
        orderBy: opts.orderBy,
        take: opts.batchSize,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        include: AdminCustomersPrismaQuery,
      });

      if (batch.length === 0) break;

      yield batch;
      cursor = batch[batch.length - 1].id;

      if (batch.length < opts.batchSize) break;
    }
  }

  async getCustomerById(
    id: string,
    authzCtx: AuthorizationContext
  ): Promise<AdminCustomerDetailPrismaType> {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: AdminCustomerDetailPrismaQuery,
    });

    if (!customer) {
      throw new NotFoundException('backend.errors.auth.customer_not_found');
    }

    if (!authzCtx.allStores && !authzCtx.storeIds.includes(customer.storeId)) {
      throw new ForbiddenException(
        'backend.errors.auth.insufficient_permissions'
      );
    }

    return customer;
  }
}
