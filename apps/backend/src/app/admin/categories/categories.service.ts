import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

function getAncestorIds(item: {
  parent?: { id: unknown; parent?: unknown } | null;
}): string[] {
  const ids: string[] = [];
  let current: { id: unknown; parent?: unknown } | null | undefined =
    item.parent;
  while (current) {
    ids.unshift(String(current.id));
    current = (current as { parent?: typeof current }).parent;
  }
  return ids;
}
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
  }): Promise<LookupItem[] | PaginatedResponse<LookupItem>> {
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
              parent: {
                include: {
                  translations: { where: { locale: lang } },
                  parent: {
                    include: {
                      translations: { where: { locale: lang } },
                      parent: true,
                    },
                  },
                },
              },
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
          ancestorIds: getAncestorIds(c),
        },
      }));
    }

    const skip = (page - 1) * limit;

    const where: Prisma.CategoryWhereInput = {
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

    const [categories, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
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
      }),
      this.prisma.category.count({ where }),
    ]);

    return {
      data: categories.map((c) => ({
        id: c.id,
        label: c.translations[0]?.name ?? c.slug,
        slug: c.slug,
        imageUrl: c.images[0]?.url,
        extra: {
          parentName: c.parent?.translations[0]?.name,
          depth: c.depth,
        },
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTree(opts: {
    q?: string;
    ids?: string[];
    parentId?: string;
    limit: number;
    page: number;
    lang: Locale;
  }): Promise<LookupItem[] | PaginatedResponse<LookupItem>> {
    const { q, ids, parentId, limit, page, lang } = opts;

    // ids mode → resolve flat (reuse existing lookup)
    if (ids?.length) {
      return this.lookup({ q, ids, limit, page, lang });
    }

    const skip = (page - 1) * limit;

    // parentId provided → fetch children of that parent (lazy load)
    if (parentId) {
      const where: Prisma.CategoryWhereInput = {
        parentId,
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

      const [categories, total] = await Promise.all([
        this.prisma.category.findMany({
          where,
          skip,
          take: limit,
          orderBy: { sortOrder: 'asc' },
          include: {
            translations: { where: { locale: lang } },
            images: { where: { isPrimary: true }, take: 1 },
            _count: { select: { children: true } },
          },
        }),
        this.prisma.category.count({ where }),
      ]);

      return {
        data: categories.map((c) => ({
          id: c.id,
          label: c.translations[0]?.name ?? c.slug,
          slug: c.slug,
          imageUrl: c.images[0]?.url,
          extra: { childCount: c._count.children },
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }

    // Root level — parentId: null
    const where: Prisma.CategoryWhereInput = {
      parentId: null,
      isActive: true,
      ...(q
        ? {
            OR: [
              {
                translations: {
                  some: {
                    locale: lang,
                    name: { contains: q, mode: 'insensitive' as const },
                  },
                },
              },
              {
                children: {
                  some: {
                    isActive: true,
                    translations: {
                      some: {
                        locale: lang,
                        name: { contains: q, mode: 'insensitive' as const },
                      },
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [categories, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        skip,
        take: limit,
        orderBy: { sortOrder: 'asc' },
        include: {
          translations: { where: { locale: lang } },
          images: { where: { isPrimary: true }, take: 1 },
          _count: { select: { children: true } },
        },
      }),
      this.prisma.category.count({ where }),
    ]);

    return {
      data: categories.map((c) => ({
        id: c.id,
        label: c.translations[0]?.name ?? c.slug,
        slug: c.slug,
        imageUrl: c.images[0]?.url,
        extra: { childCount: c._count.children },
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCategoryById(id: string): Promise<AdminCategoryDetailPrismaType> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: AdminCategoryDetailPrismaQuery,
    });

    if (!category) {
      throw new NotFoundException('backend.errors.category_not_found');
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
      throw new ConflictException('backend.errors.category_self_parent');
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
      throw new ConflictException('backend.errors.category_slug_conflict');
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
