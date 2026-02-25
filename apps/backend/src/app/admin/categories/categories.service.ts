import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Locale, Prisma } from '@org/prisma/client';
import type { LookupItem } from '@org/schemas/admin/common';
import {
  AdminCategoryDetailPrismaQuery,
  type AdminCategoryDetailPrismaType,
  AdminCategoryListPrismaQuery,
  type AdminCategoryListPrismaType,
} from '@org/types/admin/categories';
import type { FilterCondition } from '@org/types/data-query';
import type { PaginatedResponse } from '@org/types/pagination';
import { buildPrismaQuery } from '../../../core/utils/prisma-query-builder';
import { PrismaService } from '../../prisma/prisma.service';
import type { CategoryQueryDTO, CategorySaveDTO } from './dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async getCategories(
    query: CategoryQueryDTO
  ): Promise<PaginatedResponse<AdminCategoryListPrismaType>> {
    const { page, limit, filters, sort } = query;

    const { where, orderBy, skip, take } = buildPrismaQuery({
      page,
      limit,
      filters: filters as Record<string, FilterCondition> | undefined,
      sort,
      defaultSort: { field: 'createdAt', order: 'desc' },
    });

    const [items, total] = await Promise.all([
      this.prisma.category.findMany({
        where: where as Prisma.CategoryWhereInput,
        orderBy: orderBy as
          | Prisma.CategoryOrderByWithRelationInput
          | Prisma.CategoryOrderByWithRelationInput[],
        skip,
        take,
        include: AdminCategoryListPrismaQuery,
      }),
      this.prisma.category.count({ where: where as Prisma.CategoryWhereInput }),
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

  async *iterateCategories(opts: {
    where: Prisma.CategoryWhereInput;
    orderBy:
      | Prisma.CategoryOrderByWithRelationInput
      | Prisma.CategoryOrderByWithRelationInput[];
    batchSize: number;
  }): AsyncGenerator<AdminCategoryListPrismaType[]> {
    let cursor: string | undefined;

    while (true) {
      const batch = await this.prisma.category.findMany({
        where: opts.where,
        orderBy: opts.orderBy,
        take: opts.batchSize,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        include: AdminCategoryListPrismaQuery,
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
  }): Promise<LookupItem[]> {
    const { q, ids, limit, page, lang } = opts;

    if (ids?.length) {
      const categories = await this.prisma.category.findMany({
        where: { id: { in: ids } },
        include: {
          translations: { where: { locale: lang } },
          images: { where: { isPrimary: true }, take: 1 },
          parent: {
            include: {
              translations: { where: { locale: lang } },
            },
          },
        },
      });

      return categories.map((c) => ({
        id: c.id,
        label: c.translations[0]?.name ?? c.slug,
        slug: c.slug,
        imageUrl: c.images[0]?.url,
        extra: {
          parentName: c.parent?.translations[0]?.name,
          depth: c.depth,
        },
      }));
    }

    const skip = (page - 1) * limit;

    const categories = await this.prisma.category.findMany({
      where: {
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
      },
      skip,
      take: limit,
      orderBy: { sortOrder: 'asc' },
      include: {
        translations: { where: { locale: lang } },
        images: { where: { isPrimary: true }, take: 1 },
        parent: {
          include: {
            translations: { where: { locale: lang } },
          },
        },
      },
    });

    return categories.map((c) => ({
      id: c.id,
      label: c.translations[0]?.name ?? c.slug,
      slug: c.slug,
      imageUrl: c.images[0]?.url,
      extra: {
        parentName: c.parent?.translations[0]?.name,
        depth: c.depth,
      },
    }));
  }

  async getCategoryById(id: string): Promise<AdminCategoryDetailPrismaType> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: AdminCategoryDetailPrismaQuery,
    });

    if (!category) {
      throw new NotFoundException('common.errors.category_not_found');
    }

    return category;
  }

  async saveCategory(
    data: CategorySaveDTO
  ): Promise<AdminCategoryDetailPrismaType> {
    const { uniqueId, slug, parentId, isActive, translations, existingImages } =
      data;

    const cleanParentId = parentId && parentId !== '' ? parentId : null;

    // Prevent self-reference
    if (cleanParentId && cleanParentId === uniqueId) {
      throw new ConflictException('common.errors.category_self_parent');
    }

    // Calculate depth from parent
    let depth = 0;
    if (cleanParentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: cleanParentId },
        select: { depth: true },
      });
      if (parent) {
        depth = parent.depth + 1;
      }
    }

    // Check slug uniqueness (exclude self)
    const slugConflict = await this.prisma.category.findFirst({
      where: { slug, id: { not: uniqueId } },
    });
    if (slugConflict) {
      throw new ConflictException('common.errors.category_slug_conflict');
    }

    const existingImageIds = existingImages?.map((img) => img.id) ?? [];

    const category = await this.prisma.$transaction(async (tx) => {
      // Delete images that are no longer in existingImages
      await tx.image.deleteMany({
        where: {
          categoryId: uniqueId,
          ...(existingImageIds.length > 0
            ? { id: { notIn: existingImageIds } }
            : {}),
        },
      });

      // Update sortOrder for existing images
      for (const img of existingImages ?? []) {
        await tx.image.update({
          where: { id: img.id },
          data: { sortOrder: img.sortOrder },
        });
      }

      // Delete all existing translations and recreate
      await tx.categoryTranslation.deleteMany({
        where: { categoryId: uniqueId },
      });

      const translationData = translations.map((tr) => ({
        locale: tr.locale,
        name: tr.name,
        description: tr.description ?? null,
        metaTitle: tr.metaTitle ?? null,
        metaDescription: tr.metaDescription ?? null,
      }));

      // Upsert the category
      return tx.category.upsert({
        where: { id: uniqueId },
        create: {
          id: uniqueId,
          slug,
          parentId: cleanParentId,
          depth,
          isActive,
          translations: { create: translationData },
        },
        update: {
          slug,
          parentId: cleanParentId,
          depth,
          isActive,
          translations: { create: translationData },
        },
        include: AdminCategoryDetailPrismaQuery,
      });
    });

    return category;
  }
}
