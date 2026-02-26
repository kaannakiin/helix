import { Injectable, NotFoundException } from '@nestjs/common';
import type { Locale, Prisma } from '@org/prisma/client';
import type { LookupItem } from '@org/schemas/admin/common';
import {
  AdminBrandListPrismaQuery,
  type AdminBrandListPrismaType,
} from '@org/types/admin/brands';
import type { FilterCondition } from '@org/types/data-query';
import type { PaginatedResponse } from '@org/types/pagination';
import { buildPrismaQuery } from '../../../core/utils/prisma-query-builder';
import { PrismaService } from '../../prisma/prisma.service';
import type { BrandQueryDTO } from './dto';

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

  async getBrands(
    query: BrandQueryDTO
  ): Promise<PaginatedResponse<AdminBrandListPrismaType>> {
    const { page, limit, filters, sort } = query;

    const { where, orderBy, skip, take } = buildPrismaQuery({
      page,
      limit,
      filters: filters as Record<string, FilterCondition> | undefined,
      sort,
      defaultSort: { field: 'createdAt', order: 'desc' },
    });

    const [items, total] = await Promise.all([
      this.prisma.brand.findMany({
        where: where as Prisma.BrandWhereInput,
        orderBy: orderBy as
          | Prisma.BrandOrderByWithRelationInput
          | Prisma.BrandOrderByWithRelationInput[],
        skip,
        take,
        include: AdminBrandListPrismaQuery,
      }),
      this.prisma.brand.count({ where: where as Prisma.BrandWhereInput }),
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

  async *iterateBrands(opts: {
    where: Prisma.BrandWhereInput;
    orderBy:
      | Prisma.BrandOrderByWithRelationInput
      | Prisma.BrandOrderByWithRelationInput[];
    batchSize: number;
  }): AsyncGenerator<AdminBrandListPrismaType[]> {
    let cursor: string | undefined;

    while (true) {
      const batch = await this.prisma.brand.findMany({
        where: opts.where,
        orderBy: opts.orderBy,
        take: opts.batchSize,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        include: AdminBrandListPrismaQuery,
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
  }): Promise<LookupItem[] | PaginatedResponse<LookupItem>> {
    const { q, ids, limit, page, lang } = opts;

    if (ids?.length) {
      const brands = await this.prisma.brand.findMany({
        where: { id: { in: ids } },
        include: {
          translations: { where: { locale: lang } },
          images: { where: { isPrimary: true }, take: 1 },
        },
      });

      return brands.map((b) => ({
        id: b.id,
        label: b.translations[0]?.name ?? b.slug,
        slug: b.slug,
        imageUrl: b.images[0]?.url,
        extra: { websiteUrl: b.websiteUrl },
      }));
    }

    const skip = (page - 1) * limit;

    const where: Prisma.BrandWhereInput = {
      isActive: true,
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

    const [brands, total] = await Promise.all([
      this.prisma.brand.findMany({
        where,
        skip,
        take: limit,
        orderBy: { sortOrder: 'asc' },
        include: {
          translations: { where: { locale: lang } },
          images: { where: { isPrimary: true }, take: 1 },
        },
      }),
      this.prisma.brand.count({ where }),
    ]);

    return {
      data: brands.map((b) => ({
        id: b.id,
        label: b.translations[0]?.name ?? b.slug,
        slug: b.slug,
        imageUrl: b.images[0]?.url,
        extra: { websiteUrl: b.websiteUrl },
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getBrandById(id: string): Promise<AdminBrandListPrismaType> {
    const brand = await this.prisma.brand.findUnique({
      where: { id },
      include: AdminBrandListPrismaQuery,
    });

    if (!brand) {
      throw new NotFoundException('common.errors.brand_not_found');
    }

    return brand;
  }
}
