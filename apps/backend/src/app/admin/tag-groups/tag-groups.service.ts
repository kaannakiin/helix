import { Injectable, NotFoundException } from '@nestjs/common';
import type { Locale, Prisma } from '@org/prisma/client';
import type { LookupItem } from '@org/schemas/admin/common';
import {
  AdminTagGroupDetailPrismaQuery,
  AdminTagGroupListPrismaQuery,
  type AdminTagGroupDetailPrismaType,
  type AdminTagGroupListPrismaType,
} from '@org/types/admin/tags';
import type { FilterCondition } from '@org/types/data-query';
import type { PaginatedResponse } from '@org/types/pagination';
import { buildPrismaQuery } from '../../../core/utils/prisma-query-builder';
import { PrismaService } from '../../prisma/prisma.service';
import type { TagGroupQueryDTO } from './dto';

@Injectable()
export class TagGroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTagGroups(
    query: TagGroupQueryDTO
  ): Promise<PaginatedResponse<AdminTagGroupListPrismaType>> {
    const { page, limit, filters, sort } = query;

    const { where, orderBy, skip, take } = buildPrismaQuery({
      page,
      limit,
      filters: filters as Record<string, FilterCondition> | undefined,
      sort,
      defaultSort: { field: 'createdAt', order: 'desc' },
    });

    const [items, total] = await Promise.all([
      this.prisma.tagGroup.findMany({
        where: where as Prisma.TagGroupWhereInput,
        orderBy: orderBy as
          | Prisma.TagGroupOrderByWithRelationInput
          | Prisma.TagGroupOrderByWithRelationInput[],
        skip,
        take,
        include: AdminTagGroupListPrismaQuery,
      }),
      this.prisma.tagGroup.count({ where: where as Prisma.TagGroupWhereInput }),
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
        orderBy: [
          { tagGroup: { sortOrder: 'asc' } },
          { sortOrder: 'asc' },
        ],
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
    limit: number;
    page: number;
    lang: Locale;
  }): Promise<LookupItem[] | PaginatedResponse<LookupItem>> {
    const { q, ids, tagGroupId, limit, page, lang } = opts;

    // ids mode → flat resolve (reuse existing lookupTags)
    if (ids?.length) {
      return this.lookupTags({ q, ids, limit, page, lang });
    }

    const skip = (page - 1) * limit;

    // tagGroupId provided → fetch tags of that group (lazy load)
    if (tagGroupId) {
      const where: Prisma.TagWhereInput = {
        tagGroupId,
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

      const [tags, total] = await Promise.all([
        this.prisma.tag.findMany({
          where,
          skip,
          take: limit,
          orderBy: { sortOrder: 'asc' },
          include: {
            translations: { where: { locale: lang } },
            images: { where: { isPrimary: true }, take: 1 },
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
          extra: { childCount: 0 },
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }

    // Root level — tag groups with childCount
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
          _count: { select: { tags: { where: { isActive: true } } } },
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

  async getTagGroupById(id: string): Promise<AdminTagGroupDetailPrismaType> {
    const tagGroup = await this.prisma.tagGroup.findUnique({
      where: { id },
      include: AdminTagGroupDetailPrismaQuery,
    });

    if (!tagGroup) {
      throw new NotFoundException('common.errors.tag_group_not_found');
    }

    return tagGroup;
  }
}
