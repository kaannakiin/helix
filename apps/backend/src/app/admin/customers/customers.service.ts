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
import type { UserQueryDTO } from './dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async getUsers(
    query: UserQueryDTO
  ): Promise<PaginatedResponse<AdminCustomersPrismaType>> {
    const { page, limit, filters, sort } = query;

    const { where, orderBy, skip, take } = buildPrismaQuery({
      page,
      limit,
      filters,
      sort,
      defaultSort: { field: 'createdAt', order: 'desc' },
    });

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where: where as Prisma.UserWhereInput,
        orderBy: orderBy as
          | Prisma.UserOrderByWithRelationInput
          | Prisma.UserOrderByWithRelationInput[],
        skip,
        take,
        include: AdminCustomersPrismaQuery,
      }),
      this.prisma.user.count({ where: where as Prisma.UserWhereInput }),
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

  async *iterateUsers(opts: {
    where: Prisma.UserWhereInput;
    orderBy:
      | Prisma.UserOrderByWithRelationInput
      | Prisma.UserOrderByWithRelationInput[];
    batchSize: number;
  }): AsyncGenerator<AdminCustomersPrismaType[]> {
    let cursor: string | undefined;

    while (true) {
      const batch = await this.prisma.user.findMany({
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

  async getUserById(id: string): Promise<AdminCustomerDetailPrismaType> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: AdminCustomerDetailPrismaQuery,
    });

    if (!user) {
      throw new NotFoundException('backend.errors.auth.user_not_found');
    }

    return user;
  }
}
