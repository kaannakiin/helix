import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Locale, Prisma } from '@org/prisma/client';
import type { AuthorizationContext } from '@org/types/authorization';
import type { LookupItem } from '@org/schemas/admin/common';
import {
  adminCategoryDetailPrismaQuery,
  adminCategoryListPrismaQuery,
  type AdminCategoryDetailPrismaType,
  type AdminCategoryListPrismaType,
} from '@org/types/admin/categories';
import type { FilterCondition } from '@org/types/data-query';
import type { PaginatedResponse } from '@org/types/pagination';
import {
  buildPrismaQuery,
  resolveCountFilters,
  type CountRelationMap,
} from '../../../core/utils/prisma-query-builder';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadService } from '../../upload/upload.service';
import type { CategoryQueryDTO, CategorySaveDTO } from './dto';

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

const MAX_CATEGORY_IMAGES = 5;

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService
  ) {}

  private static readonly COUNT_RELATIONS: CountRelationMap = {
    children: { table: 'Category', fk: 'parentId' },
    products: { table: 'ProductCategory', fk: 'categoryId' },
    stores: { table: 'CategoryStore', fk: 'categoryId' },
  };

  private async assertCategoryStoreAccess(
    categoryId: string,
    authzCtx: AuthorizationContext
  ): Promise<void> {
    if (authzCtx.allStores) return;
    const stores = await this.prisma.categoryStore.findMany({
      where: { categoryId },
      select: { storeId: true },
    });
    const hasAccess = stores.some((s) => authzCtx.storeIds.includes(s.storeId));
    if (!hasAccess) {
      throw new ForbiddenException('backend.errors.auth.insufficient_permissions');
    }
  }

  async getCategories(
    query: CategoryQueryDTO,
    locale: Locale,
    authzCtx: AuthorizationContext
  ): Promise<PaginatedResponse<AdminCategoryListPrismaType>> {
    const { page, limit, filters, sort, search } = query;

    const {
      where: baseWhere,
      orderBy,
      skip,
      take,
      countFilters,
    } = buildPrismaQuery({
      page,
      limit,
      filters: filters as Record<string, FilterCondition> | undefined,
      sort,
      search,
      defaultSort: { field: 'createdAt', order: 'desc' },
    });

    const where = (await resolveCountFilters(
      this.prisma,
      'Category',
      CategoriesService.COUNT_RELATIONS,
      countFilters,
      baseWhere
    )) as Prisma.CategoryWhereInput;

    if (!authzCtx.allStores) {
      const storeCondition: Prisma.CategoryWhereInput = {
        stores: { some: { storeId: { in: authzCtx.storeIds } } },
      };
      where.AND = [...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []), storeCondition];
    }

    const [items, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        orderBy: orderBy as
          | Prisma.CategoryOrderByWithRelationInput
          | Prisma.CategoryOrderByWithRelationInput[],
        skip,
        take,
        include: adminCategoryListPrismaQuery(locale),
      }),
      this.prisma.category.count({ where }),
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
    locale: Locale;
  }): AsyncGenerator<AdminCategoryListPrismaType[]> {
    const { locale } = opts;
    let cursor: string | undefined;

    while (true) {
      const batch = await this.prisma.category.findMany({
        where: opts.where,
        orderBy: opts.orderBy,
        take: opts.batchSize,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        include: adminCategoryListPrismaQuery(locale),
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
    authzCtx: AuthorizationContext;
  }): Promise<LookupItem[] | PaginatedResponse<LookupItem>> {
    const { q, ids, limit, page, lang, authzCtx } = opts;

    const storeFilter: Prisma.CategoryWhereInput = !authzCtx.allStores
      ? { stores: { some: { storeId: { in: authzCtx.storeIds } } } }
      : {};

    if (ids?.length) {
      const categories = await this.prisma.category.findMany({
        where: { id: { in: ids }, ...storeFilter },
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
      ...storeFilter,
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
    authzCtx: AuthorizationContext;
  }): Promise<LookupItem[] | PaginatedResponse<LookupItem>> {
    const { q, ids, parentId, limit, page, lang, authzCtx } = opts;

    if (ids?.length) {
      return this.lookup({ q, ids, limit, page, lang, authzCtx });
    }

    const skip = (page - 1) * limit;

    const storeFilter: Prisma.CategoryWhereInput = !authzCtx.allStores
      ? { stores: { some: { storeId: { in: authzCtx.storeIds } } } }
      : {};

    if (parentId) {
      const where: Prisma.CategoryWhereInput = {
        parentId,
        isActive: true,
        ...storeFilter,
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

    const where: Prisma.CategoryWhereInput = {
      parentId: null,
      isActive: true,
      ...storeFilter,
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

  async getCategoryById(
    id: string,
    locale: Locale,
    authzCtx: AuthorizationContext
  ): Promise<AdminCategoryDetailPrismaType> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: adminCategoryDetailPrismaQuery(locale),
    });

    if (!category) {
      throw new NotFoundException('backend.errors.category_not_found');
    }

    await this.assertCategoryStoreAccess(id, authzCtx);

    return category;
  }

  async saveCategory(
    data: CategorySaveDTO,
    locale: Locale,
    authzCtx: AuthorizationContext
  ): Promise<AdminCategoryDetailPrismaType> {
    const {
      uniqueId,
      slug,
      parentId,
      isActive,
      activeStores,
      translations,
      existingImages,
    } = data;

    if (!authzCtx.allStores && activeStores) {
      for (const storeId of activeStores) {
        if (!authzCtx.storeIds.includes(storeId)) {
          throw new ForbiddenException('backend.errors.auth.insufficient_permissions');
        }
      }
    }

    const existing = await this.prisma.categoryStore.findMany({
      where: { categoryId: uniqueId },
      select: { storeId: true },
    });
    if (existing.length > 0) {
      await this.assertCategoryStoreAccess(uniqueId, authzCtx);
    }

    const cleanParentId = parentId && parentId !== '' ? parentId : null;

    if (cleanParentId && cleanParentId === uniqueId) {
      throw new ConflictException('backend.errors.category_self_parent');
    }

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

    const slugConflict = await this.prisma.category.findFirst({
      where: { slug, id: { not: uniqueId } },
    });
    if (slugConflict) {
      throw new ConflictException('backend.errors.category_slug_conflict');
    }

    const existingImageIds = existingImages?.map((img) => img.id) ?? [];

    const category = await this.prisma.$transaction(async (tx) => {
      await tx.image.deleteMany({
        where: {
          categoryId: uniqueId,
          ...(existingImageIds.length > 0
            ? { id: { notIn: existingImageIds } }
            : {}),
        },
      });

      for (const img of existingImages ?? []) {
        await tx.image.update({
          where: { id: img.id },
          data: { sortOrder: img.sortOrder },
        });
      }

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

      await tx.category.upsert({
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
      });

      await tx.categoryStore.deleteMany({
        where: { categoryId: uniqueId },
      });
      if (activeStores && activeStores.length > 0) {
        await tx.categoryStore.createMany({
          data: activeStores.map((storeId) => ({
            categoryId: uniqueId,
            storeId,
          })),
        });
      }

      return tx.category.findUniqueOrThrow({
        where: { id: uniqueId },
        include: adminCategoryDetailPrismaQuery(locale),
      });
    });

    return category;
  }

  async uploadCategoryImage(categoryId: string, file: Express.Multer.File, authzCtx: AuthorizationContext) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      throw new NotFoundException('backend.errors.category_not_found');
    }

    await this.assertCategoryStoreAccess(categoryId, authzCtx);

    const imageCount = await this.prisma.image.count({
      where: { categoryId },
    });
    if (imageCount >= MAX_CATEGORY_IMAGES) {
      throw new BadRequestException('backend.errors.max_images_exceeded');
    }

    const result = await this.uploadService.uploadFile(file, {
      ownerType: 'category',
      ownerId: categoryId,
      isNeedWebp: true,
      isNeedThumbnail: false,
    });

    await this.prisma.image.update({
      where: { id: result.imageId },
      data: { sortOrder: imageCount },
    });

    return result;
  }

  async deleteCategoryImage(
    categoryId: string,
    imageId: string,
    authzCtx: AuthorizationContext
  ): Promise<void> {
    await this.assertCategoryStoreAccess(categoryId, authzCtx);

    const image = await this.prisma.image.findFirst({
      where: { id: imageId, categoryId },
    });
    if (!image) {
      throw new NotFoundException('backend.errors.image_not_found');
    }

    await this.uploadService.deleteImage(imageId);

    const remaining = await this.prisma.image.findMany({
      where: { categoryId },
      orderBy: { sortOrder: 'asc' },
    });
    for (let i = 0; i < remaining.length; i++) {
      await this.prisma.image.update({
        where: { id: remaining[i].id },
        data: { sortOrder: i },
      });
    }
  }
}
