import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Locale, type Prisma } from '@org/prisma/client';
import { slugify } from '@org/utils/slugify';
import {
  AdminVariantGroupDetailPrismaQuery,
  AdminVariantGroupListPrismaQuery,
  type AdminVariantGroupDetailPrismaType,
  type AdminVariantGroupListPrismaType,
} from '@org/types/admin/variants';
import type { ImageOwnerType } from '@org/types/admin/upload';
import type { FilterCondition } from '@org/types/data-query';
import type { PaginatedResponse } from '@org/types/pagination';
import type { LookupItem } from '@org/schemas/admin/common';
import { buildPrismaQuery } from '../../../core/utils/prisma-query-builder';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadService } from '../../upload/upload.service';
import type { VariantGroupQueryDTO } from './dto';

@Injectable()
export class VariantGroupsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
  ) {}

  async getVariantGroups(
    query: VariantGroupQueryDTO
  ): Promise<PaginatedResponse<AdminVariantGroupListPrismaType>> {
    const { page, limit, filters, sort } = query;

    const { where, orderBy, skip, take } = buildPrismaQuery({
      page,
      limit,
      filters: filters as Record<string, FilterCondition> | undefined,
      sort,
      defaultSort: { field: 'createdAt', order: 'desc' },
    });

    const [items, total] = await Promise.all([
      this.prisma.variantGroup.findMany({
        where: where as Prisma.VariantGroupWhereInput,
        orderBy: orderBy as
          | Prisma.VariantGroupOrderByWithRelationInput
          | Prisma.VariantGroupOrderByWithRelationInput[],
        skip,
        take,
        include: AdminVariantGroupListPrismaQuery,
      }),
      this.prisma.variantGroup.count({ where: where as Prisma.VariantGroupWhereInput }),
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

  async *iterateVariantGroups(opts: {
    where: Prisma.VariantGroupWhereInput;
    orderBy:
      | Prisma.VariantGroupOrderByWithRelationInput
      | Prisma.VariantGroupOrderByWithRelationInput[];
    batchSize: number;
  }): AsyncGenerator<AdminVariantGroupListPrismaType[]> {
    let cursor: string | undefined;

    while (true) {
      const batch = await this.prisma.variantGroup.findMany({
        where: opts.where,
        orderBy: opts.orderBy,
        take: opts.batchSize,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        include: AdminVariantGroupListPrismaQuery,
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
    exclude?: string[];
    limit: number;
    page: number;
    lang: Locale;
  }): Promise<LookupItem[]> {
    const { q, ids, exclude, limit, page, lang } = opts;

    const include = {
      translations: { where: { locale: lang } },
      options: {
        take: 5,
        orderBy: { sortOrder: 'asc' as const },
        include: { translations: { where: { locale: lang } } },
      },
    };

    if (ids?.length) {
      const groups = await this.prisma.variantGroup.findMany({
        where: { id: { in: ids } },
        include,
      });

      return groups.map((g) => ({
        id: g.id,
        label: g.translations[0]?.name ?? g.id,
        extra: {
          type: g.type,
          optionLabels: g.options.map((o) => o.translations[0]?.name ?? '').filter(Boolean),
        },
      }));
    }

    const where: Prisma.VariantGroupWhereInput = {
      ...(exclude?.length ? { id: { notIn: exclude } } : {}),
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

    const skip = (page - 1) * limit;

    const groups = await this.prisma.variantGroup.findMany({
      where,
      skip,
      take: limit,
      orderBy: { sortOrder: 'asc' },
      include,
    });

    return groups.map((g) => ({
      id: g.id,
      label: g.translations[0]?.name ?? g.id,
      extra: {
        type: g.type,
        optionLabels: g.options.map((o) => o.translations[0]?.name ?? '').filter(Boolean),
      },
    }));
  }

  async checkNameExists(opts: {
    name: string;
    excludeIds?: string[];
  }): Promise<{ exists: boolean; matchedGroupId?: string; matchedLocale?: string }> {
    const { name, excludeIds } = opts;

    const slugs = Object.values(Locale).map((locale) =>
      slugify(name, locale.toLowerCase())
    );

    const match = await this.prisma.variantGroupTranslation.findFirst({
      where: {
        slug: { in: slugs },
        ...(excludeIds?.length
          ? { variantGroupId: { notIn: excludeIds } }
          : {}),
      },
      select: {
        variantGroupId: true,
        locale: true,
      },
    });

    if (!match) {
      return { exists: false };
    }

    return {
      exists: true,
      matchedGroupId: match.variantGroupId,
      matchedLocale: match.locale,
    };
  }

  async getVariantGroupById(id: string): Promise<AdminVariantGroupDetailPrismaType> {
    const variantGroup = await this.prisma.variantGroup.findUnique({
      where: { id },
      include: AdminVariantGroupDetailPrismaQuery,
    });

    if (!variantGroup) {
      throw new NotFoundException('common.errors.variant_group_not_found');
    }

    return variantGroup;
  }

  async uploadOptionImage(opts: {
    optionId: string;
    ownerType: 'variantOption' | 'productVariantGroupOption';
    file: Express.Multer.File;
  }) {
    const { optionId, ownerType, file } = opts;

    // Verify entity exists
    if (ownerType === 'variantOption') {
      const option = await this.prisma.variantOption.findUnique({
        where: { id: optionId },
        select: { id: true },
      });
      if (!option) {
        throw new NotFoundException('common.errors.variant_option_not_found');
      }
    } else {
      const pvgOption = await this.prisma.productVariantGroupOption.findUnique({
        where: { id: optionId },
        select: { id: true },
      });
      if (!pvgOption) {
        throw new NotFoundException(
          'common.errors.product_variant_group_option_not_found',
        );
      }
    }

    // Single image rule: delete existing image before uploading new one
    await this.uploadService.deleteImagesByOwner(
      ownerType as ImageOwnerType,
      optionId,
    );

    // Upload new image
    const result = await this.uploadService.uploadFile(file, {
      ownerType,
      ownerId: optionId,
      isNeedWebp: true,
      isNeedThumbnail: false,
    });

    return result;
  }
}
