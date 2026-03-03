import {
  BadRequestException,
  ConflictException,
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
import type { VariantGroupQueryDTO, VariantGroupSaveDTO } from './dto';

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

  async saveVariantGroup(
    data: VariantGroupSaveDTO,
  ): Promise<AdminVariantGroupDetailPrismaType> {
    const { uniqueId, type, sortOrder, translations, options } = data;
    const id = uniqueId;
    const incomingOptionIds = options.map((o) => o.uniqueId);

    return this.prisma.$transaction(async (tx) => {
      // Check if any removed options are referenced by products
      const existingOptions = await tx.variantOption.findMany({
        where: { variantGroupId: id },
        select: { id: true },
      });
      const existingOptionIds = existingOptions.map((o) => o.id);
      const removedOptionIds = existingOptionIds.filter(
        (eid) => !incomingOptionIds.includes(eid),
      );

      if (removedOptionIds.length > 0) {
        const referencedCount = await tx.productVariantGroupOption.count({
          where: { variantOptionId: { in: removedOptionIds } },
        });
        if (referencedCount > 0) {
          throw new ConflictException(
            'common.errors.variant_option_in_use',
          );
        }
      }

      // Delete removed options (cascade: translations, images)
      if (removedOptionIds.length > 0) {
        await tx.variantOption.deleteMany({
          where: { id: { in: removedOptionIds } },
        });
      }

      // Delete and recreate group translations
      await tx.variantGroupTranslation.deleteMany({
        where: { variantGroupId: id },
      });

      // Process each option
      for (const option of options) {
        const optionId = option.uniqueId;

        // Delete option translations (will recreate)
        await tx.variantOptionTranslation.deleteMany({
          where: { variantOptionId: optionId },
        });

        // Handle existing images
        const keepImageIds =
          option.existingImages?.map((img) => img.id) ?? [];
        await tx.image.deleteMany({
          where: {
            variantOptionId: optionId,
            ...(keepImageIds.length > 0
              ? { id: { notIn: keepImageIds } }
              : {}),
          },
        });

        for (const img of option.existingImages ?? []) {
          await tx.image.updateMany({
            where: { id: img.id, variantOptionId: optionId },
            data: { sortOrder: img.sortOrder },
          });
        }

        // Upsert option
        await tx.variantOption.upsert({
          where: { id: optionId },
          create: {
            id: optionId,
            variantGroupId: id,
            colorCode: option.colorCode || null,
            sortOrder: option.sortOrder,
            translations: {
              create: option.translations.map((tr) => ({
                locale: tr.locale,
                name: tr.name,
                slug: tr.slug,
              })),
            },
          },
          update: {
            colorCode: option.colorCode || null,
            sortOrder: option.sortOrder,
            translations: {
              create: option.translations.map((tr) => ({
                locale: tr.locale,
                name: tr.name,
                slug: tr.slug,
              })),
            },
          },
        });
      }

      // Upsert the variant group
      return tx.variantGroup.upsert({
        where: { id },
        create: {
          id,
          type,
          sortOrder,
          translations: {
            create: translations.map((tr) => ({
              locale: tr.locale,
              name: tr.name,
              slug: tr.slug,
            })),
          },
        },
        update: {
          type,
          sortOrder,
          translations: {
            create: translations.map((tr) => ({
              locale: tr.locale,
              name: tr.name,
              slug: tr.slug,
            })),
          },
        },
        include: AdminVariantGroupDetailPrismaQuery,
      });
    });
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
