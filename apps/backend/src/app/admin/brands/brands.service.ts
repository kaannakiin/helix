import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Locale, Prisma } from '@org/prisma/client';
import type { LookupItem } from '@org/schemas/admin/common';
import {
  adminBrandDetailPrismaQuery,
  adminBrandListPrismaQuery,
  type AdminBrandDetailPrismaType,
  type AdminBrandListPrismaType,
} from '@org/types/admin/brands';
import type { FilterCondition } from '@org/types/data-query';
import type { PaginatedResponse } from '@org/types/pagination';
import {
  buildPrismaQuery,
  resolveCountFilters,
  type CountRelationMap,
} from '../../../core/utils/prisma-query-builder';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadService } from '../../upload/upload.service';
import type { BrandQueryDTO, BrandSaveDTO } from './dto';

@Injectable()
export class BrandsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService
  ) {}

  private static readonly COUNT_RELATIONS: CountRelationMap = {
    products: { table: 'Product', fk: 'brandId' },
  };

  async getBrands(
    query: BrandQueryDTO,
    locale: Locale
  ): Promise<PaginatedResponse<AdminBrandListPrismaType>> {
    const { page, limit, filters, sort, search } = query;

    const { where: baseWhere, orderBy, skip, take, countFilters } =
      buildPrismaQuery({
        page,
        limit,
        filters: filters as Record<string, FilterCondition> | undefined,
        sort,
        search,
        defaultSort: { field: 'createdAt', order: 'desc' },
      });

    const where = (await resolveCountFilters(
      this.prisma,
      'Brand',
      BrandsService.COUNT_RELATIONS,
      countFilters,
      baseWhere
    )) as Prisma.BrandWhereInput;

    const [items, total] = await Promise.all([
      this.prisma.brand.findMany({
        where,
        orderBy: orderBy as
          | Prisma.BrandOrderByWithRelationInput
          | Prisma.BrandOrderByWithRelationInput[],
        skip,
        take,
        include: adminBrandListPrismaQuery(locale),
      }),
      this.prisma.brand.count({ where }),
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

  async *iterateBrands(opts: {
    where: Prisma.BrandWhereInput;
    orderBy:
      | Prisma.BrandOrderByWithRelationInput
      | Prisma.BrandOrderByWithRelationInput[];
    batchSize: number;
    locale: Locale;
  }): AsyncGenerator<AdminBrandListPrismaType[]> {
    const { locale } = opts;
    let cursor: string | undefined;

    while (true) {
      const batch = await this.prisma.brand.findMany({
        where: opts.where,
        orderBy: opts.orderBy,
        take: opts.batchSize,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        include: adminBrandListPrismaQuery(locale),
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
      const brands = await this.prisma.brand.findMany({
        where: { id: { in: ids } },
        include: {
          translations: { where: { locale: lang } },
          images: { where: { isPrimary: true }, take: 1 },
        },
      });

      return brands.map((b) => ({
        id: b.id,
        label: b.translations[0]?.name ?? b.slug,
        slug: b.slug,
        imageUrl: b.images[0]?.url,
        extra: { websiteUrl: b.websiteUrl },
      }));
    }

    const skip = (page - 1) * limit;

    const where: Prisma.BrandWhereInput = {
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

    const [brands, total] = await Promise.all([
      this.prisma.brand.findMany({
        where,
        skip,
        take: limit,
        orderBy: { sortOrder: 'asc' },
        include: {
          translations: { where: { locale: lang } },
          images: { where: { isPrimary: true }, take: 1 },
        },
      }),
      this.prisma.brand.count({ where }),
    ]);

    return {
      data: brands.map((b) => ({
        id: b.id,
        label: b.translations[0]?.name ?? b.slug,
        slug: b.slug,
        imageUrl: b.images[0]?.url,
        extra: { websiteUrl: b.websiteUrl },
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getBrandById(id: string, locale: Locale): Promise<AdminBrandDetailPrismaType> {
    const brand = await this.prisma.brand.findUnique({
      where: { id },
      include: adminBrandDetailPrismaQuery(locale),
    });

    if (!brand) {
      throw new NotFoundException('backend.errors.brand_not_found');
    }

    return brand;
  }

  async saveBrand(data: BrandSaveDTO, locale: Locale): Promise<AdminBrandDetailPrismaType> {
    const { id, slug, websiteUrl, isActive, sortOrder, translations, existingImages } = data;

    const slugConflict = await this.prisma.brand.findFirst({
      where: { slug, id: { not: id } },
    });
    if (slugConflict) {
      throw new ConflictException('backend.errors.brand_slug_conflict');
    }

    const existingImageIds = existingImages?.map((img) => img.id) ?? [];

    const brand = await this.prisma.$transaction(async (tx) => {
      await tx.image.deleteMany({
        where: {
          brandId: id,
          ...(existingImageIds.length > 0
            ? { id: { notIn: existingImageIds } }
            : {}),
        },
      });

      const sortedExisting = [...(existingImages ?? [])].sort(
        (a, b) => a.sortOrder - b.sortOrder
      );
      for (let i = 0; i < sortedExisting.length; i++) {
        await tx.image.update({
          where: { id: sortedExisting[i].id },
          data: { sortOrder: i },
        });
      }

      await tx.brandTranslation.deleteMany({
        where: { brandId: id },
      });

      const translationData = translations.map((tr) => ({
        locale: tr.locale,
        name: tr.name,
        description: tr.description ?? null,
      }));

      return tx.brand.upsert({
        where: { id },
        create: {
          id,
          slug,
          websiteUrl: websiteUrl || null,
          isActive,
          sortOrder,
          translations: { create: translationData },
        },
        update: {
          slug,
          websiteUrl: websiteUrl || null,
          isActive,
          sortOrder,
          translations: { create: translationData },
        },
        include: adminBrandDetailPrismaQuery(locale),
      });
    });

    return brand;
  }

  async uploadBrandImage(brandId: string, file: Express.Multer.File) {
    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
    });
    if (!brand) {
      throw new NotFoundException('backend.errors.brand_not_found');
    }

    const imageCount = await this.prisma.image.count({
      where: { brandId },
    });
    if (imageCount >= 3) {
      throw new BadRequestException('backend.errors.max_images_exceeded');
    }

    const result = await this.uploadService.uploadFile(file, {
      ownerType: 'brand',
      ownerId: brandId,
      isNeedWebp: true,
      isNeedThumbnail: false,
    });

    await this.prisma.image.update({
      where: { id: result.imageId },
      data: { sortOrder: imageCount },
    });

    return result;
  }

  async deleteBrandImage(brandId: string, imageId: string): Promise<void> {
    const image = await this.prisma.image.findFirst({
      where: { id: imageId, brandId },
    });
    if (!image) {
      throw new NotFoundException('backend.errors.image_not_found');
    }

    await this.uploadService.deleteImage(imageId);

    const remaining = await this.prisma.image.findMany({
      where: { brandId },
      orderBy: { sortOrder: 'asc' },
    });
    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].sortOrder !== i) {
        await this.prisma.image.update({
          where: { id: remaining[i].id },
          data: { sortOrder: i },
        });
      }
    }
  }
}
