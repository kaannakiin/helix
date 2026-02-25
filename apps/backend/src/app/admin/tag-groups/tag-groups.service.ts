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
  }): Promise<LookupItem[]> {
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
        extra: { tagGroupId: t.tagGroupId },
      }));
    }

    const skip = (page - 1) * limit;

    const tags = await this.prisma.tag.findMany({
      where: {
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
      },
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
    });

    return tags.map((t) => ({
      id: t.id,
      label: t.translations[0]?.name ?? t.slug,
      slug: t.slug,
      imageUrl: t.images[0]?.url,
      group: t.tagGroup.translations[0]?.name ?? t.tagGroup.slug,
      extra: { tagGroupId: t.tagGroupId },
    }));
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
