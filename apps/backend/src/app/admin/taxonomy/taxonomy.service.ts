import { Injectable, NotFoundException } from '@nestjs/common';
import type { Locale, Prisma } from '@org/prisma/client';
import type { LookupItem } from '@org/schemas/admin/common';
import type { PaginatedResponse } from '@org/types/pagination';
import { PrismaService } from '../../prisma/prisma.service';

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

type TaxonomyTreeNode = LookupItem & { children?: TaxonomyTreeNode[] };

@Injectable()
export class TaxonomyService {
  constructor(private readonly prisma: PrismaService) {}

  async getTree(opts: {
    q?: string;
    ids?: string[];
    page: number;
    limit: number;
    parentId?: string;
    lang: Locale;
  }): Promise<LookupItem[] | PaginatedResponse<TaxonomyTreeNode>> {
    const { q, ids, page, limit, parentId, lang } = opts;

    if (ids?.length) {
      return this.lookup({ ids, page, limit, lang });
    }

    const skip = (page - 1) * limit;

    if (q) {
      const where: Prisma.GoogleTaxonomyWhereInput = {
        translations: {
          some: {
            locale: lang,
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { path: { contains: q, mode: 'insensitive' } },
            ],
          },
        },
      };

      const [items, total] = await Promise.all([
        this.prisma.googleTaxonomy.findMany({
          where,
          skip,
          take: limit,
          include: {
            translations: { where: { locale: lang } },
            _count: { select: { children: true } },
          },
        }),
        this.prisma.googleTaxonomy.count({ where }),
      ]);

      return {
        data: items.map((item) => ({
          id: String(item.id),
          label: item.translations[0]?.name ?? String(item.id),
          slug: String(item.id),
          extra: {
            path: item.translations[0]?.path ?? '',
            childCount: item._count.children,
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

    const parentIdInt = parentId ? parseInt(parentId, 10) : null;
    const where: Prisma.GoogleTaxonomyWhereInput = {
      parentId: parentIdInt,
    };

    const [items, total] = await Promise.all([
      this.prisma.googleTaxonomy.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: 'asc' },
        include: {
          translations: { where: { locale: lang } },
          _count: { select: { children: true } },
        },
      }),
      this.prisma.googleTaxonomy.count({ where }),
    ]);

    return {
      data: items.map((item) => ({
        id: String(item.id),
        label: item.translations[0]?.name ?? String(item.id),
        slug: String(item.id),
        extra: {
          path: item.translations[0]?.path ?? '',
          childCount: item._count.children,
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

  async lookup(opts: {
    q?: string;
    ids?: string[];
    page: number;
    limit: number;
    lang: Locale;
  }): Promise<LookupItem[] | PaginatedResponse<LookupItem>> {
    const { q, ids, page, limit, lang } = opts;

    if (ids?.length) {
      const numericIds = ids.map((id) => parseInt(id, 10)).filter(isFinite);

      const items = await this.prisma.googleTaxonomy.findMany({
        where: { id: { in: numericIds } },
        include: {
          translations: { where: { locale: lang } },
          _count: { select: { children: true } },
          parent: {
            include: {
              parent: {
                include: {
                  parent: {
                    include: {
                      parent: {
                        include: { parent: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      return items.map((item) => ({
        id: String(item.id),
        label: item.translations[0]?.name ?? String(item.id),
        slug: String(item.id),
        extra: {
          path: item.translations[0]?.path ?? '',
          childCount: item._count.children,
          ancestorIds: getAncestorIds(item),
        },
      }));
    }

    const skip = (page - 1) * limit;

    const where: Prisma.GoogleTaxonomyWhereInput = q
      ? {
          translations: {
            some: {
              locale: lang,
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { path: { contains: q, mode: 'insensitive' } },
              ],
            },
          },
        }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.googleTaxonomy.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: 'asc' },
        include: {
          translations: { where: { locale: lang } },
          _count: { select: { children: true } },
        },
      }),
      this.prisma.googleTaxonomy.count({ where }),
    ]);

    return {
      data: items.map((item) => ({
        id: String(item.id),
        label: item.translations[0]?.name ?? String(item.id),
        slug: String(item.id),
        extra: {
          path: item.translations[0]?.path ?? '',
          childCount: item._count.children,
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

  async getTaxonomyById(id: number): Promise<LookupItem> {
    const item = await this.prisma.googleTaxonomy.findUnique({
      where: { id },
      include: {
        translations: true,
        _count: { select: { children: true } },
      },
    });

    if (!item) {
      throw new NotFoundException('backend.errors.taxonomy_not_found');
    }

    return {
      id: String(item.id),
      label: item.translations[0]?.name ?? String(item.id),
      slug: String(item.id),
      extra: {
        path: item.translations[0]?.path ?? '',
        childCount: item._count.children,
      },
    };
  }
}
