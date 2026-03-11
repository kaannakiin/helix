import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@org/prisma/client';
import {
  AdminPriceListDetailPrismaQuery,
  AdminPriceListListPrismaQuery,
  type AdminPriceListDetailPrismaType,
  type AdminPriceListListPrismaType,
} from '@org/types/admin/pricing';
import type { AuthorizationContext } from '@org/types/authorization';
import type { FilterCondition } from '@org/types/data-query';
import type { PaginatedResponse } from '@org/types/pagination';
import { buildPrismaQuery } from '../../../core/utils/prisma-query-builder';
import { PrismaService } from '../../prisma/prisma.service';
import type { PriceListQueryDTO, PriceListSaveDTO } from './dto';

@Injectable()
export class PriceListsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPriceLists(
    query: PriceListQueryDTO,
    authzCtx: AuthorizationContext
  ): Promise<PaginatedResponse<AdminPriceListListPrismaType>> {
    const { page, limit, filters, sort } = query;

    const { where, orderBy, skip, take } = buildPrismaQuery({
      page,
      limit,
      filters: filters as Record<string, FilterCondition> | undefined,
      sort,
      defaultSort: { field: 'createdAt', order: 'desc' },
    });

    const typedWhere = where as Prisma.PriceListWhereInput;
    if (!authzCtx.allStores) {
      const storeCondition = { storeId: { in: authzCtx.storeIds } };
      typedWhere.AND = [...(Array.isArray(typedWhere.AND) ? typedWhere.AND : typedWhere.AND ? [typedWhere.AND] : []), storeCondition];
    }

    const [items, total] = await Promise.all([
      this.prisma.priceList.findMany({
        where: typedWhere,
        orderBy: orderBy as
          | Prisma.PriceListOrderByWithRelationInput
          | Prisma.PriceListOrderByWithRelationInput[],
        skip,
        take,
        include: AdminPriceListListPrismaQuery,
      }),
      this.prisma.priceList.count({
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

  async getPriceListById(
    id: string,
    authzCtx: AuthorizationContext
  ): Promise<AdminPriceListDetailPrismaType> {
    const priceList = await this.prisma.priceList.findUnique({
      where: { id },
      include: AdminPriceListDetailPrismaQuery,
    });

    if (!priceList) {
      throw new NotFoundException('backend.errors.price_list_not_found');
    }

    if (
      !authzCtx.allStores &&
      !authzCtx.storeIds.includes(priceList.storeId)
    ) {
      throw new ForbiddenException(
        'backend.errors.auth.insufficient_permissions'
      );
    }

    return priceList;
  }

  async savePriceList(
    data: PriceListSaveDTO,
    authzCtx: AuthorizationContext
  ): Promise<AdminPriceListDetailPrismaType> {
    const { uniqueId, name, storeId, prices: _prices, ...rest } = data;

    if (!authzCtx.allStores && !authzCtx.storeIds.includes(storeId)) {
      throw new ForbiddenException('backend.errors.auth.no_store_access');
    }

    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
    });
    if (!store) {
      throw new NotFoundException('backend.errors.store_not_found');
    }

    const nameConflict = await this.prisma.priceList.findFirst({
      where: {
        name,
        storeId,
        id: { not: uniqueId },
        status: { not: 'ARCHIVED' },
      },
    });
    if (nameConflict) {
      throw new ConflictException('backend.errors.price_list_name_conflict');
    }

    const parentPriceListId = rest.parentPriceListId || null;

    if (parentPriceListId) {
      const parent = await this.prisma.priceList.findUnique({
        where: { id: parentPriceListId },
        select: { storeId: true },
      });
      if (!parent) {
        throw new NotFoundException(
          'backend.errors.parent_price_list_not_found'
        );
      }
      if (parent.storeId !== storeId) {
        throw new BadRequestException(
          'backend.errors.parent_price_list_cross_store'
        );
      }

      await this.detectCircularParent(uniqueId, parentPriceListId);
    }

    const sourceCurrencyCode = rest.sourceCurrencyCode || null;
    const isExchangeRateDerived = rest.isExchangeRateDerived ?? false;

    const payload = {
      name,
      ...rest,
      parentPriceListId,
      contractRef: rest.contractRef || null,
      sourceCurrencyCode: isExchangeRateDerived ? sourceCurrencyCode : null,
      roundingRule: isExchangeRateDerived
        ? rest.roundingRule ?? 'NONE'
        : 'NONE',
      isExchangeRateDerived,
    };

    const effectiveStatus = payload.status ?? 'DRAFT';
    if (effectiveStatus !== 'ACTIVE') {
      (payload as any).isActive = false;
    }

    if (payload.type === 'BASE') {
      payload.parentPriceListId = null;
      payload.adjustmentType = null as any;
      payload.adjustmentValue = null as any;
    }

    const existing = await this.prisma.priceList.findUnique({
      where: { id: uniqueId },
      select: {
        storeId: true,
        status: true,
        isSourceLocked: true,
        isSystemManaged: true,
      },
    });

    if (existing) {
      if (existing.storeId !== storeId) {
        throw new ForbiddenException(
          'backend.errors.price_list_store_mismatch'
        );
      }

      if (existing.isSourceLocked) {
        const allowedFields = new Set(['status', 'isActive']);
        const changedFields = Object.keys(payload).filter((key) => {
          return (
            payload[key as keyof typeof payload] !== undefined &&
            !allowedFields.has(key)
          );
        });
        if (changedFields.length > 0) {
          throw new BadRequestException(
            'backend.errors.price_list_source_locked'
          );
        }
      }

      if (existing.isSystemManaged) {
        const protectedFields: (keyof typeof payload)[] = [
          'type',
          'defaultCurrencyCode',
          'isActive',
        ];

        const current = await this.prisma.priceList.findUnique({
          where: { id: uniqueId },
          select: { type: true, defaultCurrencyCode: true, isActive: true },
        });
        if (current) {
          for (const field of protectedFields) {
            if (
              payload[field] !== undefined &&
              payload[field] !== current[field as keyof typeof current]
            ) {
              throw new BadRequestException(
                'backend.errors.price_list_system_managed_field'
              );
            }
          }
        }
      }

      const newStatus = payload.status;
      if (newStatus && newStatus !== existing.status) {
        this.validateStatusTransition(existing.status, newStatus);

        if (newStatus === 'ACTIVE') {
          await this.validateActivation(uniqueId, payload, storeId);
        }

        if (newStatus === 'ARCHIVED' || newStatus === 'DRAFT') {
          (payload as any).isActive = false;
        }
      }

      return this.prisma.priceList.update({
        where: { id: uniqueId },
        data: payload,
        include: AdminPriceListDetailPrismaQuery,
      });
    }

    return this.prisma.priceList.create({
      data: {
        id: uniqueId,
        storeId,
        ...payload,
      },
      include: AdminPriceListDetailPrismaQuery,
    });
  }

  /**
   * S7: Activation gate — checks completeness before DRAFT→ACTIVE.
   */
  private async validateActivation(
    priceListId: string,
    payload: Record<string, unknown>,
    storeId: string
  ): Promise<void> {
    const errors: string[] = [];

    const currencyCode = payload.defaultCurrencyCode as string;
    if (currencyCode) {
      const storeCurrency = await this.prisma.storeCurrency.findUnique({
        where: {
          storeId_currencyCode: { storeId, currencyCode: currencyCode as any },
        },
      });
      if (!storeCurrency) {
        errors.push('currency_not_in_store_policy');
      }
    }

    const priceCount = await this.prisma.priceListPrice.count({
      where: { priceListId },
    });
    if (priceCount === 0) {
      errors.push('no_price_rows');
    }

    const missingPrices = await this.prisma.priceListPrice.count({
      where: { priceListId, originType: 'FIXED', price: null },
    });
    if (missingPrices > 0) {
      errors.push('fixed_rows_missing_price');
    }

    const missingAdjustments = await this.prisma.priceListPrice.count({
      where: {
        priceListId,
        originType: 'RELATIVE',
        OR: [{ adjustmentType: null }, { adjustmentValue: null }],
      },
    });
    if (missingAdjustments > 0) {
      errors.push('relative_rows_missing_adjustment');
    }

    const type = (payload.type as string) ?? 'BASE';
    const typesRequiringAssignment = ['SALE', 'CONTRACT'];
    if (typesRequiringAssignment.includes(type)) {
      const assignmentCount = await this.prisma.priceListAssignment.count({
        where: { priceListId },
      });
      if (assignmentCount === 0) {
        errors.push('no_assignments');
      }
    }

    const validTo = payload.validTo as string | null | undefined;
    if (validTo && new Date(validTo) < new Date()) {
      errors.push('validity_expired');
    }

    if (errors.length > 0) {
      throw new BadRequestException(
        `backend.errors.price_list_activation_failed|{"reasons":"${errors.join(
          ', '
        )}"}`
      );
    }
  }

  /**
   * Allowed transitions: DRAFT→ACTIVE, DRAFT→ARCHIVED, ACTIVE→ARCHIVED.
   * No reverse transitions (ARCHIVED→DRAFT, ARCHIVED→ACTIVE, ACTIVE→DRAFT).
   */
  private validateStatusTransition(
    currentStatus: string,
    newStatus: string
  ): void {
    const allowed: Record<string, string[]> = {
      DRAFT: ['ACTIVE', 'ARCHIVED'],
      ACTIVE: ['ARCHIVED'],
      ARCHIVED: [],
    };

    const validTargets = allowed[currentStatus] ?? [];
    if (!validTargets.includes(newStatus)) {
      throw new BadRequestException(
        'backend.errors.price_list_invalid_status_transition'
      );
    }
  }

  /**
   * Walk the parent chain to detect circular references.
   * Max depth 10 to prevent infinite loops on corrupted data.
   */
  private async detectCircularParent(
    selfId: string,
    parentId: string
  ): Promise<void> {
    let currentId: string | null = parentId;
    const visited = new Set<string>([selfId]);
    let depth = 0;

    while (currentId && depth < 10) {
      if (visited.has(currentId)) {
        throw new BadRequestException(
          'backend.errors.price_list_circular_parent'
        );
      }
      visited.add(currentId);
      const node: { parentPriceListId: string | null } | null =
        await this.prisma.priceList.findUnique({
          where: { id: currentId },
          select: { parentPriceListId: true },
        });
      currentId = node?.parentPriceListId ?? null;
      depth++;
    }
  }

  async deletePriceList(id: string, authzCtx: AuthorizationContext): Promise<void> {
    const priceList = await this.prisma.priceList.findUnique({
      where: { id },
      select: { isSystemManaged: true, storeId: true },
    });

    if (!priceList) {
      throw new NotFoundException('backend.errors.price_list_not_found');
    }

    if (!authzCtx.allStores && !authzCtx.storeIds.includes(priceList.storeId)) {
      throw new ForbiddenException('backend.errors.auth.no_store_access');
    }

    if (priceList.isSystemManaged) {
      throw new BadRequestException(
        'backend.errors.cannot_delete_system_price_list'
      );
    }

    await this.prisma.priceList.delete({ where: { id } });
  }
}
