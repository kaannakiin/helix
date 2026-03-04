import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Locale, Prisma } from '@org/prisma/client';
import type { LookupItem } from '@org/schemas/admin/common';
import type { RecursiveBackendTagInput } from '@org/schemas/admin/tags';
import {
  AdminTagChildrenPrismaQuery,
  AdminTagGroupDetailPrismaQuery,
  AdminTagGroupListPrismaQuery,
  type AdminTagChildrenPrismaType,
  type AdminTagGroupDetailPrismaType,
  type AdminTagGroupListPrismaType,
} from '@org/types/admin/tags';
import type { FilterCondition } from '@org/types/data-query';
import type { PaginatedResponse } from '@org/types/pagination';
import {
  buildPrismaQuery,
  resolveCountFilters,
  type CountRelationMap,
} from '../../../core/utils/prisma-query-builder';
import { PrismaService } from '../../prisma/prisma.service';
import type { TagGroupQueryDTO, TagGroupSaveDTO, TagSaveDTO } from './dto';

@Injectable()
export class TagGroupsService {
  constructor(private readonly prisma: PrismaService) {}

  private static readonly COUNT_RELATIONS: CountRelationMap = {
    tags: { table: 'Tag', fk: 'tagGroupId' },
  };

  async getTagGroups(
    query: TagGroupQueryDTO
  ): Promise<PaginatedResponse<AdminTagGroupListPrismaType>> {
    const { page, limit, filters, sort } = query;

    const { where: baseWhere, orderBy, skip, take, countFilters } =
      buildPrismaQuery({
        page,
        limit,
        filters: filters as Record<string, FilterCondition> | undefined,
        sort,
        defaultSort: { field: 'createdAt', order: 'desc' },
      });

    const where = (await resolveCountFilters(
      this.prisma,
      'TagGroup',
      TagGroupsService.COUNT_RELATIONS,
      countFilters,
      baseWhere
    )) as Prisma.TagGroupWhereInput;

    const [items, total] = await Promise.all([
      this.prisma.tagGroup.findMany({
        where,
        orderBy: orderBy as
          | Prisma.TagGroupOrderByWithRelationInput
          | Prisma.TagGroupOrderByWithRelationInput[],
        skip,
        take,
        include: AdminTagGroupListPrismaQuery,
      }),
      this.prisma.tagGroup.count({ where }),
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

  async *iterateTagGroups(opts: {
    where: Prisma.TagGroupWhereInput;
    orderBy:
      | Prisma.TagGroupOrderByWithRelationInput
      | Prisma.TagGroupOrderByWithRelationInput[];
    batchSize: number;
  }): AsyncGenerator<AdminTagGroupListPrismaType[]> {
    let cursor: string | undefined;

    while (true) {
      const batch = await this.prisma.tagGroup.findMany({
        where: opts.where,
        orderBy: opts.orderBy,
        take: opts.batchSize,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        include: AdminTagGroupListPrismaQuery,
      });

      if (batch.length === 0) break;

      yield batch;
      cursor = batch[batch.length - 1].id;

      if (batch.length < opts.batchSize) break;
    }
  }

  async lookupTags(opts: {
    q?: string;
    ids?: string[];
    limit: number;
    page: number;
    lang: Locale;
  }): Promise<LookupItem[] | PaginatedResponse<LookupItem>> {
    const { q, ids, limit, page, lang } = opts;

    if (ids?.length) {
      const tags = await this.prisma.tag.findMany({
        where: { id: { in: ids } },
        include: {
          translations: { where: { locale: lang } },
          images: { where: { isPrimary: true }, take: 1 },
          tagGroup: {
            include: {
              translations: { where: { locale: lang } },
            },
          },
        },
      });

      return tags.map((t) => ({
        id: t.id,
        label: t.translations[0]?.name ?? t.slug,
        slug: t.slug,
        imageUrl: t.images[0]?.url,
        group: t.tagGroup.translations[0]?.name ?? t.tagGroup.slug,
        extra: { tagGroupId: t.tagGroupId, ancestorIds: [t.tagGroupId] },
      }));
    }

    const skip = (page - 1) * limit;

    const where: Prisma.TagWhereInput = {
      isActive: true,
      tagGroup: { isActive: true },
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

    const [tags, total] = await Promise.all([
      this.prisma.tag.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ tagGroup: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
        include: {
          translations: { where: { locale: lang } },
          images: { where: { isPrimary: true }, take: 1 },
          tagGroup: {
            include: {
              translations: { where: { locale: lang } },
            },
          },
        },
      }),
      this.prisma.tag.count({ where }),
    ]);

    return {
      data: tags.map((t) => ({
        id: t.id,
        label: t.translations[0]?.name ?? t.slug,
        slug: t.slug,
        imageUrl: t.images[0]?.url,
        group: t.tagGroup.translations[0]?.name ?? t.tagGroup.slug,
        extra: { tagGroupId: t.tagGroupId },
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTagTree(opts: {
    q?: string;
    ids?: string[];
    tagGroupId?: string;
    parentTagId?: string;
    limit: number;
    page: number;
    lang: Locale;
  }): Promise<LookupItem[] | PaginatedResponse<LookupItem>> {
    const { q, ids, tagGroupId, parentTagId, limit, page, lang } = opts;

    if (ids?.length) {
      return this.lookupTags({ q, ids, limit, page, lang });
    }

    const skip = (page - 1) * limit;

    if (tagGroupId) {
      const translationFilter = q
        ? {
            translations: {
              some: {
                locale: lang,
                name: { contains: q, mode: 'insensitive' as const },
              },
            },
          }
        : {};

      const where: Prisma.TagWhereInput = {
        tagGroupId,
        parentTagId: parentTagId ?? null,
        isActive: true,
        ...translationFilter,
      };

      const [tags, total] = await Promise.all([
        this.prisma.tag.findMany({
          where,
          skip,
          take: limit,
          orderBy: { sortOrder: 'asc' },
          include: {
            translations: { where: { locale: lang } },
            images: { where: { isPrimary: true }, take: 1 },
            _count: { select: { children: { where: { isActive: true } } } },
          },
        }),
        this.prisma.tag.count({ where }),
      ]);

      return {
        data: tags.map((t) => ({
          id: t.id,
          label: t.translations[0]?.name ?? t.slug,
          slug: t.slug,
          imageUrl: t.images[0]?.url,
          extra: {
            childCount: t._count.children,
            tagGroupId,
            ancestorIds: [tagGroupId],
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

    const where: Prisma.TagGroupWhereInput = {
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
                tags: {
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

    const [tagGroups, total] = await Promise.all([
      this.prisma.tagGroup.findMany({
        where,
        skip,
        take: limit,
        orderBy: { sortOrder: 'asc' },
        include: {
          translations: { where: { locale: lang } },
          _count: {
            select: { tags: { where: { isActive: true, parentTagId: null } } },
          },
        },
      }),
      this.prisma.tagGroup.count({ where }),
    ]);

    return {
      data: tagGroups.map((tg) => ({
        id: tg.id,
        label: tg.translations[0]?.name ?? tg.slug,
        slug: tg.slug,
        extra: { childCount: tg._count.tags },
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTagChildren(
    tagGroupId: string,
    parentTagId?: string
  ): Promise<AdminTagChildrenPrismaType[]> {
    return this.prisma.tag.findMany({
      where: {
        tagGroupId,
        parentTagId: parentTagId ?? null,
      },
      orderBy: { sortOrder: 'asc' },
      include: AdminTagChildrenPrismaQuery,
    });
  }

  async getTagGroupById(id: string): Promise<AdminTagGroupDetailPrismaType> {
    const tagGroup = await this.prisma.tagGroup.findUnique({
      where: { id },
      include: AdminTagGroupDetailPrismaQuery,
    });

    if (!tagGroup) {
      throw new NotFoundException('backend.errors.tag_group_not_found');
    }

    return tagGroup;
  }

  async saveTagGroup(
    data: TagGroupSaveDTO
  ): Promise<AdminTagGroupDetailPrismaType> {
    const { id, slug, isActive, sortOrder, translations, tags } = data;

    const slugConflict = await this.prisma.tagGroup.findFirst({
      where: { slug, id: { not: id } },
    });
    if (slugConflict) {
      throw new ConflictException('backend.errors.tag_group_slug_conflict');
    }

    const tagGroup = await this.prisma.$transaction(async (tx) => {
      await tx.tagGroupTranslation.deleteMany({ where: { tagGroupId: id } });

      const group = await tx.tagGroup.upsert({
        where: { id },
        create: {
          id,
          slug,
          isActive,
          sortOrder,
          translations: {
            create: translations.map((tr) => ({
              locale: tr.locale,
              name: tr.name,
              description: tr.description ?? null,
            })),
          },
        },
        update: {
          slug,
          isActive,
          sortOrder,
          translations: {
            create: translations.map((tr) => ({
              locale: tr.locale,
              name: tr.name,
              description: tr.description ?? null,
            })),
          },
        },
        include: AdminTagGroupDetailPrismaQuery,
      });

      if (tags && tags.length > 0) {
        await this.createTagsRecursively(tx, id, tags, null, 0);
      }

      return group;
    });

    return tagGroup;
  }

  private async createTagsRecursively(
    tx: Parameters<Parameters<typeof this.prisma.$transaction>[0]>[0],
    tagGroupId: string,
    tags: RecursiveBackendTagInput[],
    parentTagId: string | null,
    depth: number
  ): Promise<void> {
    for (const tagData of tags) {
      await tx.tag.create({
        data: {
          id: tagData.id,
          tagGroupId,
          slug: tagData.slug,
          parentTagId,
          depth,
          isActive: tagData.isActive,
          sortOrder: tagData.sortOrder,
          translations: {
            create: tagData.translations.map((tr) => ({
              locale: tr.locale as Locale,
              name: tr.name,
              description: tr.description ?? null,
            })),
          },
        },
      });

      if (tagData.children?.length) {
        await this.createTagsRecursively(
          tx,
          tagGroupId,
          tagData.children,
          tagData.id,
          depth + 1
        );
      }
    }
  }

  async saveTag(
    tagGroupId: string,
    data: TagSaveDTO
  ): Promise<AdminTagChildrenPrismaType> {
    const {
      id,
      slug,
      parentTagId,
      isActive,
      sortOrder,
      translations,
      existingImages,
    } = data;

    let depth = 0;
    if (parentTagId) {
      const parent = await this.prisma.tag.findUnique({
        where: { id: parentTagId },
        select: { depth: true },
      });
      if (!parent) {
        throw new NotFoundException('backend.errors.parent_tag_not_found');
      }
      depth = parent.depth + 1;
    }

    const slugConflict = await this.prisma.tag.findFirst({
      where: {
        tagGroupId,
        parentTagId: parentTagId ?? null,
        slug,
        id: { not: id },
      },
    });
    if (slugConflict) {
      throw new ConflictException('backend.errors.tag_slug_conflict');
    }

    const existingImageIds = existingImages?.map((img) => img.id) ?? [];

    return this.prisma.$transaction(async (tx) => {
      await tx.tagTranslation.deleteMany({ where: { tagId: id } });

      await tx.image.deleteMany({
        where: {
          tagId: id,
          ...(existingImageIds.length > 0
            ? { id: { notIn: existingImageIds } }
            : {}),
        },
      });

      for (const img of existingImages ?? []) {
        await tx.image.updateMany({
          where: { id: img.id, tagId: id },
          data: { sortOrder: img.sortOrder },
        });
      }

      const tag = await tx.tag.upsert({
        where: { id },
        create: {
          id,
          tagGroupId,
          slug,
          parentTagId: parentTagId ?? null,
          depth,
          isActive,
          sortOrder,
          translations: {
            create: translations.map((tr) => ({
              locale: tr.locale as Locale,
              name: tr.name,
              description: tr.description ?? null,
            })),
          },
        },
        update: {
          slug,
          parentTagId: parentTagId ?? null,
          depth,
          isActive,
          sortOrder,
          translations: {
            create: translations.map((tr) => ({
              locale: tr.locale as Locale,
              name: tr.name,
              description: tr.description ?? null,
            })),
          },
        },
        include: AdminTagChildrenPrismaQuery,
      });

      return tag;
    });
  }

  async deleteTag(tagId: string): Promise<void> {
    const tag = await this.prisma.tag.findUnique({
      where: { id: tagId },
      select: { id: true },
    });
    if (!tag) {
      throw new NotFoundException('backend.errors.tag_not_found');
    }

    await this.prisma.tag.delete({ where: { id: tagId } });
  }

  async deleteTags(ids: string[]): Promise<{ count: number }> {
    const result = await this.prisma.tag.deleteMany({
      where: { id: { in: ids } },
    });
    return { count: result.count };
  }
}
