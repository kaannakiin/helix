import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@org/prisma/client';
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
    query: CustomerQueryDTO
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

    const [items, total] = await Promise.all([
      this.prisma.customer.findMany({
        where: where as Prisma.CustomerWhereInput,
        orderBy: orderBy as
          | Prisma.CustomerOrderByWithRelationInput
          | Prisma.CustomerOrderByWithRelationInput[],
        skip,
        take,
        include: AdminCustomersPrismaQuery,
      }),
      this.prisma.customer.count({ where: where as Prisma.CustomerWhereInput }),
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

  async getCustomerById(id: string): Promise<AdminCustomerDetailPrismaType> {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: AdminCustomerDetailPrismaQuery,
    });

    if (!customer) {
      throw new NotFoundException('backend.errors.auth.customer_not_found');
    }

    return customer;
  }
}
