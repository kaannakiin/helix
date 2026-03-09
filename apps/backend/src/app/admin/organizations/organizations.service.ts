import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@org/prisma/client';
import {
  AdminOrganizationDetailPrismaQuery,
  AdminOrganizationsPrismaQuery,
  type AdminOrganizationDetailPrismaType,
  type AdminOrganizationsPrismaType,
} from '@org/types/admin/organizations';
import type { PaginatedResponse } from '@org/types/pagination';
import { buildPrismaQuery } from '../../../core/utils/prisma-query-builder';
import { PrismaService } from '../../prisma/prisma.service';
import type { OrganizationQueryDTO } from './dto';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrganizations(
    query: OrganizationQueryDTO
  ): Promise<PaginatedResponse<AdminOrganizationsPrismaType>> {
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
      this.prisma.organization.findMany({
        where: where as Prisma.OrganizationWhereInput,
        orderBy: orderBy as
          | Prisma.OrganizationOrderByWithRelationInput
          | Prisma.OrganizationOrderByWithRelationInput[],
        skip,
        take,
        include: AdminOrganizationsPrismaQuery,
      }),
      this.prisma.organization.count({
        where: where as Prisma.OrganizationWhereInput,
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

  async *iterateOrganizations(opts: {
    where: Prisma.OrganizationWhereInput;
    orderBy:
      | Prisma.OrganizationOrderByWithRelationInput
      | Prisma.OrganizationOrderByWithRelationInput[];
    batchSize: number;
  }): AsyncGenerator<AdminOrganizationsPrismaType[]> {
    let cursor: string | undefined;

    while (true) {
      const batch = await this.prisma.organization.findMany({
        where: opts.where,
        orderBy: opts.orderBy,
        take: opts.batchSize,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        include: AdminOrganizationsPrismaQuery,
      });

      if (batch.length === 0) break;

      yield batch;
      cursor = batch[batch.length - 1].id;

      if (batch.length < opts.batchSize) break;
    }
  }

  async getOrganizationById(
    id: string
  ): Promise<AdminOrganizationDetailPrismaType> {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      include: AdminOrganizationDetailPrismaQuery,
    });

    if (!organization) {
      throw new NotFoundException('backend.errors.organization_not_found');
    }

    return organization;
  }
}
