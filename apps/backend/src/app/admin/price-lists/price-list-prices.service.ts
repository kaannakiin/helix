import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@org/prisma/client';
import type {
  PriceListPriceBulkCreateOutput,
  PriceListPriceSaveOutput,
} from '@org/schemas/admin/pricing';
import {
  AdminPriceListPriceListPrismaQuery,
  type AdminPriceListPriceListPrismaType,
} from '@org/types/admin/pricing';
import type { AuthorizationContext } from '@org/types/authorization';
import type { PaginatedResponse } from '@org/types/pagination';
import { buildPrismaQuery } from '../../../core/utils/prisma-query-builder';
import { PrismaService } from '../../prisma/prisma.service';
import type { PriceListPriceQueryDTO } from './dto/index.js';

const PRICE_INCLUDE = AdminPriceListPriceListPrismaQuery;

@Injectable()
export class PriceListPricesService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertParentStoreAccess(
    priceListId: string,
    authzCtx: AuthorizationContext
  ): Promise<string> {
    const pl = await this.prisma.priceList.findUniqueOrThrow({
      where: { id: priceListId },
      select: { storeId: true },
    });
    if (!authzCtx.allStores && !authzCtx.storeIds.includes(pl.storeId)) {
      throw new ForbiddenException('backend.errors.auth.no_store_access');
    }
    return pl.storeId;
  }

  async query(
    priceListId: string,
    dto: PriceListPriceQueryDTO,
    authzCtx: AuthorizationContext
  ): Promise<PaginatedResponse<AdminPriceListPriceListPrismaType>> {
    await this.assertParentStoreAccess(priceListId, authzCtx);

    const { page, limit, filters, sort, search } = dto;
    const {
      where: baseWhere,
      orderBy,
      skip,
      take,
    } = buildPrismaQuery({
      page,
      limit,
      filters,
      sort,
      search,
      defaultSort: { field: 'createdAt', order: 'desc' },
    });

    const where = { ...baseWhere, priceListId };

    const [data, total] = await Promise.all([
      this.prisma.priceListPrice.findMany({
        where,
        orderBy,
        skip,
        take,
        include: PRICE_INCLUDE,
      }),
      this.prisma.priceListPrice.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page: page ?? 1,
        limit: limit ?? 20,
        total,
        totalPages: Math.ceil(total / (limit ?? 20)),
      },
    };
  }

  async save(
    priceListId: string,
    data: PriceListPriceSaveOutput,
    authzCtx: AuthorizationContext
  ): Promise<AdminPriceListPriceListPrismaType> {
    await this.assertParentStoreAccess(priceListId, authzCtx);

    this.normalizeOriginType(data);

    if (data.id) {
      const existing = await this.prisma.priceListPrice.findFirst({
        where: { id: data.id, priceListId },
      });
      if (!existing)
        throw new NotFoundException(
          'backend.errors.price_list_price_not_found'
        );
      if (existing.isSourceLocked)
        throw new BadRequestException('backend.errors.price_list_price_locked');

      const { id, priceListId: _pl, ...updateData } = data;
      return this.prisma.priceListPrice.update({
        where: { id },
        data: updateData,
        include: PRICE_INCLUDE,
      });
    }

    const duplicate = await this.prisma.priceListPrice.findFirst({
      where: {
        priceListId,
        productVariantId: data.productVariantId,
        currencyCode: data.currencyCode,
        unitOfMeasureId: data.unitOfMeasureId,
        minQuantity: data.minQuantity,
      },
    });
    if (duplicate)
      throw new ConflictException('backend.errors.price_list_price_duplicate');

    const { id: _id, priceListId: _pl, ...createData } = data;
    return this.prisma.priceListPrice.create({
      data: { ...createData, priceListId },
      include: PRICE_INCLUDE,
    });
  }

  /**
   * S8: Clear stale fields when originType changes.
   * FIXED: clear adjustment fields. RELATIVE: clear source price fields.
   */
  private normalizeOriginType(data: PriceListPriceSaveOutput): void {
    if (data.originType === 'FIXED') {
      data.adjustmentType = null;
      data.adjustmentValue = null;
    }
    if (data.originType === 'RELATIVE') {
      (data as any).sourcePrice = null;
      (data as any).sourceAppliedExchangeRate = null;
      (data as any).lastRateComputedAt = null;
    }
  }

  async delete(priceListId: string, id: string, authzCtx: AuthorizationContext): Promise<void> {
    await this.assertParentStoreAccess(priceListId, authzCtx);

    const existing = await this.prisma.priceListPrice.findFirst({
      where: { id, priceListId },
    });
    if (!existing)
      throw new NotFoundException('backend.errors.price_list_price_not_found');
    if (existing.isSourceLocked)
      throw new BadRequestException('backend.errors.price_list_price_locked');

    await this.prisma.priceListPrice.delete({ where: { id } });
  }

  async bulkCreate(priceListId: string, data: PriceListPriceBulkCreateOutput, authzCtx: AuthorizationContext) {
    await this.assertParentStoreAccess(priceListId, authzCtx);

    const existing = await this.prisma.priceListPrice.findMany({
      where: {
        priceListId,
        productVariantId: { in: data.variantIds },
        currencyCode: data.currencyCode,
        unitOfMeasureId: data.unitOfMeasureId,
        minQuantity: 1,
      },
      select: { productVariantId: true },
    });

    const existingSet = new Set(existing.map((e) => e.productVariantId));
    const newVariantIds = data.variantIds.filter((id) => !existingSet.has(id));

    if (newVariantIds.length === 0) {
      return { created: 0 };
    }

    const result = await this.prisma.priceListPrice.createMany({
      data: newVariantIds.map((variantId) => ({
        priceListId,
        productVariantId: variantId,
        currencyCode: data.currencyCode,
        unitOfMeasureId: data.unitOfMeasureId,
        originType: data.originType,
        minQuantity: 1,
      })),
    });

    return { created: result.count };
  }

  async summary(priceListId: string, authzCtx: AuthorizationContext) {
    await this.assertParentStoreAccess(priceListId, authzCtx);

    const [totalRows, lockedRows, missingPrices, currencyGroups] =
      await Promise.all([
        this.prisma.priceListPrice.count({ where: { priceListId } }),
        this.prisma.priceListPrice.count({
          where: { priceListId, isSourceLocked: true },
        }),
        this.prisma.priceListPrice.count({
          where: { priceListId, originType: 'FIXED', price: null },
        }),
        (this.prisma.priceListPrice.groupBy as any)({
          by: ['currencyCode'],
          where: { priceListId },
          _count: true,
        }),
      ]);

    return {
      totalRows,
      lockedRows,
      missingPrices,
      currencies: currencyGroups.map(
        (g: { currencyCode: string }) => g.currencyCode
      ),
    };
  }

  async searchVariants(
    priceListId: string,
    search: string,
    page: number,
    limit: number,
    authzCtx: AuthorizationContext
  ) {
    const storeId = await this.assertParentStoreAccess(priceListId, authzCtx);

    const skip = (page - 1) * limit;

    const addedVariants = await this.prisma.priceListPrice.findMany({
      where: { priceListId },
      select: { productVariantId: true },
      distinct: ['productVariantId'],
    });
    const addedSet = new Set(addedVariants.map((v) => v.productVariantId));

    const storeFilter: Prisma.ProductVariantWhereInput = {
      product: {
        is: {
          stores: {
            some: { storeId },
          },
        },
      },
    };

    const searchFilter: Prisma.ProductVariantWhereInput[] = search
      ? [
          {
            OR: [
              { sku: { contains: search, mode: 'insensitive' as const } },
              {
                product: {
                  is: {
                    translations: {
                      some: {
                        name: {
                          contains: search,
                          mode: 'insensitive' as const,
                        },
                      },
                    },
                  },
                },
              },
            ],
          },
        ]
      : [];

    const notInFilter: Prisma.ProductVariantWhereInput[] =
      addedSet.size > 0 ? [{ id: { notIn: [...addedSet] } }] : [];

    const where: Prisma.ProductVariantWhereInput = {
      ...storeFilter,
      AND: [...searchFilter, ...notInFilter],
    };

    const [data, total] = await Promise.all([
      this.prisma.productVariant.findMany({
        where,
        skip,
        take: limit,
        include: {
          product: {
            select: {
              id: true,
              translations: { select: { name: true, locale: true } },
            },
          },
        },
        orderBy: { sku: 'asc' },
      }),
      this.prisma.productVariant.count({ where }),
    ]);

    return {
      data: data.map((v) => ({
        id: v.id,
        sku: v.sku,
        productName: v.product.translations[0]?.name ?? '',
      })),
      pagination: { page, limit, total },
    };
  }
}
