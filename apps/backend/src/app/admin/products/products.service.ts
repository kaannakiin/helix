import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Locale, Prisma } from '@org/prisma/client';
import {
  adminProductDetailPrismaQuery,
  adminProductListPrismaQuery,
  type AdminProductDetailPrismaType,
  type AdminProductListPrismaType,
} from '@org/types/admin/products';
import type { ImageOwnerType } from '@org/types/admin/upload';
import type { FilterCondition } from '@org/types/data-query';
import type { PaginatedResponse } from '@org/types/pagination';
import {
  buildPrismaQuery,
  resolveCountFilters,
  type CountRelationMap,
} from '../../../core/utils/prisma-query-builder';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadService } from '../../upload/upload.service';
import type { ProductQueryDTO, ProductSaveDTO } from './dto';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService
  ) {}

  private static readonly COUNT_RELATIONS: CountRelationMap = {
    variants: { table: 'ProductVariant', fk: 'productId' },
    categories: { table: 'ProductCategory', fk: 'productId' },
    tags: { table: 'ProductTag', fk: 'productId' },
    stores: { table: 'ProductStore', fk: 'productId' },
  };

  async getProducts(
    query: ProductQueryDTO,
    locale: Locale
  ): Promise<PaginatedResponse<AdminProductListPrismaType>> {
    const { page, limit, filters, sort } = query;

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
      defaultSort: { field: 'createdAt', order: 'desc' },
    });

    const resolvedWhere = await resolveCountFilters(
      this.prisma,
      'Product',
      ProductsService.COUNT_RELATIONS,
      countFilters,
      baseWhere
    );

    if (resolvedWhere['storeIds']) {
      const storeIdsFilter = resolvedWhere['storeIds'] as { in?: string[]; equals?: string };
      const ids = storeIdsFilter.in ?? (storeIdsFilter.equals ? [storeIdsFilter.equals] : []);
      delete resolvedWhere['storeIds'];
      if (ids.length > 0) {
        resolvedWhere['stores'] = { some: { storeId: { in: ids } } };
      }
    }

    const where = resolvedWhere as Prisma.ProductWhereInput;

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy: orderBy as
          | Prisma.ProductOrderByWithRelationInput
          | Prisma.ProductOrderByWithRelationInput[],
        skip,
        take,
        include: adminProductListPrismaQuery(locale),
      }),
      this.prisma.product.count({ where }),
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

  async *iterateProducts(opts: {
    where: Prisma.ProductWhereInput;
    orderBy:
      | Prisma.ProductOrderByWithRelationInput
      | Prisma.ProductOrderByWithRelationInput[];
    batchSize: number;
    locale: Locale;
  }): AsyncGenerator<AdminProductListPrismaType[]> {
    const { locale } = opts;
    let cursor: string | undefined;

    while (true) {
      const batch = await this.prisma.product.findMany({
        where: opts.where,
        orderBy: opts.orderBy,
        take: opts.batchSize,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        include: adminProductListPrismaQuery(locale),
      });

      if (batch.length === 0) break;

      yield batch;
      cursor = batch[batch.length - 1].id;

      if (batch.length < opts.batchSize) break;
    }
  }

  async getProductById(
    id: string,
    locale: Locale
  ): Promise<AdminProductDetailPrismaType> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: adminProductDetailPrismaQuery(locale),
    });

    if (!product) {
      throw new NotFoundException('backend.errors.product_not_found');
    }

    return product;
  }

  async getProductStores(productId: string) {
    const rows = await this.prisma.productStore.findMany({
      where: { productId },
      include: { store: true },
    });

    return rows.map((r) => ({
      id: r.store.id,
      name: r.store.name,
      businessModel: r.store.businessModel,
      status: r.store.status,
    }));
  }

  async saveProduct(
    data: ProductSaveDTO,
    locale: Locale
  ): Promise<AdminProductDetailPrismaType> {
    const {
      uniqueId,
      type,
      status,
      brandId,
      hasVariants,
      translations,
      existingImages,
      variantGroups,
      variants,
      categories,
      tagIds,
      activeStores,
    } = data;

    const cleanBrandId = brandId && brandId !== '' ? brandId : null;

    for (const tr of translations) {
      const conflict = await this.prisma.productTranslation.findFirst({
        where: {
          locale: tr.locale,
          slug: tr.slug,
          productId: { not: uniqueId },
        },
      });
      if (conflict) {
        throw new ConflictException('backend.errors.product_slug_conflict');
      }
    }

    const skus = variants
      .map((v) => v.sku)
      .filter((s): s is string => !!s && s.length > 0);
    if (skus.length > 0) {
      const skuConflicts = await this.prisma.productVariant.findMany({
        where: { sku: { in: skus }, productId: { not: uniqueId } },
        select: { sku: true },
      });
      if (skuConflicts.length > 0) {
        throw new ConflictException('backend.errors.product_sku_conflict');
      }
    }

    const groupIds = variantGroups.map((g) => g.uniqueId);
    const existingDbGroups =
      groupIds.length > 0
        ? await this.prisma.variantGroup.findMany({
            where: { id: { in: groupIds } },
            select: { id: true },
          })
        : [];
    const existingGroupIdSet = new Set(existingDbGroups.map((g) => g.id));

    const currentProduct = await this.prisma.product.findUnique({
      where: { id: uniqueId },
      include: {
        variantGroups: {
          include: { options: { include: { images: true } } },
        },
        variants: { include: { images: true } },
        categories: true,
        tags: true,
      },
    });

    if (
      !hasVariants &&
      currentProduct &&
      (currentProduct.variantGroups.length > 0 ||
        currentProduct.variants.length > 0)
    ) {
      throw new ConflictException(
        'backend.errors.product_has_variants_cannot_disable'
      );
    }

    const minioCleanupQueue: Array<{
      ownerType: ImageOwnerType;
      ownerId: string;
    }> = [];

    const product = await this.prisma.$transaction(async (tx) => {
      const existingImageIds = existingImages?.map((img) => img.id) ?? [];
      await tx.image.deleteMany({
        where: {
          productId: uniqueId,
          productVariantId: null,
          productVariantGroupOptionId: null,
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

      if (hasVariants) {
        if (currentProduct) {
          const newGroupIds = new Set(variantGroups.map((g) => g.uniqueId));
          const removedPvgs = currentProduct.variantGroups.filter(
            (pvg) => !newGroupIds.has(pvg.variantGroupId)
          );
          for (const removed of removedPvgs) {
            for (const opt of removed.options) {
              if (opt.images.length > 0) {
                await tx.image.deleteMany({
                  where: { productVariantGroupOptionId: opt.id },
                });
                minioCleanupQueue.push({
                  ownerType: 'productVariantGroupOption',
                  ownerId: opt.id,
                });
              }
            }
            await tx.productVariantGroup.delete({
              where: { id: removed.id },
            });
          }
        }

        const newGroups = variantGroups.filter(
          (g) => !existingGroupIdSet.has(g.uniqueId)
        );
        for (const group of newGroups) {
          await tx.variantGroup.create({
            data: {
              id: group.uniqueId,
              type: group.type,
              sortOrder: group.sortOrder,
              translations: {
                create: group.translations.map((tr) => ({
                  locale: tr.locale,
                  name: tr.name,
                  slug: tr.slug,
                })),
              },
              options: {
                create: group.options.map((opt) => ({
                  id: opt.uniqueId,
                  colorCode: opt.colorCode ?? null,
                  sortOrder: opt.sortOrder,
                  translations: {
                    create: opt.translations.map((otr) => ({
                      locale: otr.locale,
                      name: otr.name,
                      slug: otr.slug,
                    })),
                  },
                })),
              },
            },
          });

          for (const opt of group.options) {
            const optExistingImageIds =
              opt.existingImages?.map((img) => img.id) ?? [];
            if (optExistingImageIds.length > 0) {
              for (const img of opt.existingImages ?? []) {
                await tx.image.update({
                  where: { id: img.id },
                  data: {
                    variantOptionId: opt.uniqueId,
                    sortOrder: img.sortOrder,
                  },
                });
              }
            }
          }
        }

        for (const group of variantGroups) {
          const isNewGroup = !existingGroupIdSet.has(group.uniqueId);

          const pvg = await tx.productVariantGroup.upsert({
            where: {
              productId_variantGroupId: {
                productId: uniqueId,
                variantGroupId: group.uniqueId,
              },
            },
            create: {
              productId: uniqueId,
              variantGroupId: group.uniqueId,
              sortOrder: group.sortOrder,
              displayMode: group.displayMode ?? null,
            },
            update: {
              sortOrder: group.sortOrder,
              displayMode: group.displayMode ?? null,
            },
          });

          const currentPvgOptions =
            currentProduct?.variantGroups.find(
              (g) => g.variantGroupId === group.uniqueId
            )?.options ?? [];

          const newOptionIds = new Set(group.options.map((o) => o.uniqueId));

          const removedOptions = currentPvgOptions.filter(
            (o) => !newOptionIds.has(o.variantOptionId)
          );
          for (const removed of removedOptions) {
            if (removed.images.length > 0) {
              await tx.image.deleteMany({
                where: { productVariantGroupOptionId: removed.id },
              });
              minioCleanupQueue.push({
                ownerType: 'productVariantGroupOption',
                ownerId: removed.id,
              });
            }
            await tx.productVariantGroupOption.delete({
              where: { id: removed.id },
            });
          }

          for (const opt of group.options) {
            const pvgOpt = await tx.productVariantGroupOption.upsert({
              where: {
                productVariantGroupId_variantOptionId: {
                  productVariantGroupId: pvg.id,
                  variantOptionId: opt.uniqueId,
                },
              },
              create: {
                productVariantGroupId: pvg.id,
                variantOptionId: opt.uniqueId,
                sortOrder: opt.sortOrder,
                colorCode: isNewGroup ? null : opt.colorCode ?? null,
              },
              update: {
                sortOrder: opt.sortOrder,
                colorCode: isNewGroup ? null : opt.colorCode ?? null,
              },
            });

            if (!isNewGroup) {
              const pvgOptExistingImageIds =
                opt.existingImages?.map((img) => img.id) ?? [];

              await tx.image.deleteMany({
                where: {
                  productVariantGroupOptionId: pvgOpt.id,
                  ...(pvgOptExistingImageIds.length > 0
                    ? { id: { notIn: pvgOptExistingImageIds } }
                    : {}),
                },
              });

              for (const img of opt.existingImages ?? []) {
                await tx.image.update({
                  where: { id: img.id },
                  data: { sortOrder: img.sortOrder },
                });
              }
            }
          }
        }
      }

      if (hasVariants) {
        if (currentProduct) {
          const newVariantIds = new Set(variants.map((v) => v.uniqueId));
          const removedVariants = currentProduct.variants.filter(
            (v) => !newVariantIds.has(v.id)
          );
          for (const removed of removedVariants) {
            if (removed.images.length > 0) {
              minioCleanupQueue.push({
                ownerType: 'productVariant',
                ownerId: removed.id,
              });
            }
          }
          if (removedVariants.length > 0) {
            const removedIds = removedVariants.map((v) => v.id);
            await tx.image.deleteMany({
              where: { productVariantId: { in: removedIds } },
            });
            await tx.productVariant.deleteMany({
              where: { id: { in: removedIds } },
            });
          }
        }

        for (const variant of variants) {
          const variantExistingImageIds =
            variant.existingImages?.map((img) => img.id) ?? [];

          await tx.image.deleteMany({
            where: {
              productVariantId: variant.uniqueId,
              ...(variantExistingImageIds.length > 0
                ? { id: { notIn: variantExistingImageIds } }
                : {}),
            },
          });

          for (const img of variant.existingImages ?? []) {
            await tx.image.update({
              where: { id: img.id },
              data: { sortOrder: img.sortOrder },
            });
          }

          await tx.productVariantValue.deleteMany({
            where: { productVariantId: variant.uniqueId },
          });

          await tx.productVariant.upsert({
            where: { id: variant.uniqueId },
            create: {
              id: variant.uniqueId,
              productId: uniqueId,
              sku: variant.sku || null,
              barcode: variant.barcode || null,
              isActive: variant.isActive,
              trackingStrategy: variant.trackingStrategy,
              sortOrder: variant.sortOrder,
              optionValues: {
                create: variant.optionValueIds.map((optId) => ({
                  variantOptionId: optId,
                })),
              },
            },
            update: {
              sku: variant.sku || null,
              barcode: variant.barcode || null,
              isActive: variant.isActive,
              trackingStrategy: variant.trackingStrategy,
              sortOrder: variant.sortOrder,
              optionValues: {
                create: variant.optionValueIds.map((optId) => ({
                  variantOptionId: optId,
                })),
              },
            },
          });
        }
      }

      await tx.productCategory.deleteMany({
        where: { productId: uniqueId },
      });
      if (categories.length > 0) {
        await tx.productCategory.createMany({
          data: categories.map((cat) => ({
            productId: uniqueId,
            categoryId: cat.categoryId,
            sortOrder: cat.sortOrder,
          })),
        });
      }

      await tx.productTag.deleteMany({
        where: { productId: uniqueId },
      });
      if (tagIds.length > 0) {
        await tx.productTag.createMany({
          data: tagIds.map((tagId) => ({
            productId: uniqueId,
            tagId,
          })),
        });
      }

      await tx.productStore.deleteMany({
        where: { productId: uniqueId },
      });
      if (activeStores.length > 0) {
        await tx.productStore.createMany({
          data: activeStores.map((storeId) => ({
            productId: uniqueId,
            storeId,
          })),
        });
      }

      await tx.productTranslation.deleteMany({
        where: { productId: uniqueId },
      });

      const translationData = translations.map((tr) => ({
        locale: tr.locale,
        name: tr.name,
        slug: tr.slug,
        shortDescription: tr.shortDescription ?? null,
        description: tr.description ?? null,
      }));

      return tx.product.upsert({
        where: { id: uniqueId },
        create: {
          id: uniqueId,
          type,
          status,
          brandId: cleanBrandId,
          translations: { create: translationData },
        },
        update: {
          type,
          status,
          brandId: cleanBrandId,
          translations: { create: translationData },
        },
        include: adminProductDetailPrismaQuery(locale),
      });
    });

    for (const item of minioCleanupQueue) {
      try {
        await this.uploadService.deleteImagesByOwner(
          item.ownerType,
          item.ownerId
        );
      } catch {}
    }

    return product;
  }

  async deleteProduct(id: string): Promise<void> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        variantGroups: { include: { options: true } },
        variants: true,
      },
    });

    if (!product) {
      throw new NotFoundException('backend.errors.product_not_found');
    }

    await this.uploadService.deleteImagesByOwner('product', id);

    for (const variant of product.variants) {
      await this.uploadService.deleteImagesByOwner(
        'productVariant',
        variant.id
      );
    }

    for (const pvg of product.variantGroups) {
      for (const opt of pvg.options) {
        await this.uploadService.deleteImagesByOwner(
          'productVariantGroupOption',
          opt.id
        );
      }
    }

    await this.prisma.product.delete({ where: { id } });
  }

  async deleteProductImage(productId: string, imageId: string): Promise<void> {
    const image = await this.prisma.image.findUnique({
      where: { id: imageId },
      select: {
        id: true,
        productId: true,
        productVariantId: true,
        productVariantGroupOptionId: true,
      },
    });
    if (!image) {
      throw new NotFoundException('backend.errors.image_not_found');
    }

    if (image.productId) {
      if (image.productId !== productId) {
        throw new NotFoundException('backend.errors.image_not_found');
      }
    } else if (image.productVariantId) {
      const variant = await this.prisma.productVariant.findFirst({
        where: { id: image.productVariantId, productId },
      });
      if (!variant) {
        throw new NotFoundException('backend.errors.image_not_found');
      }
    } else if (image.productVariantGroupOptionId) {
      const pvgOption = await this.prisma.productVariantGroupOption.findFirst({
        where: {
          id: image.productVariantGroupOptionId,
          productVariantGroup: { productId },
        },
      });
      if (!pvgOption) {
        throw new NotFoundException('backend.errors.image_not_found');
      }
    } else {
      throw new NotFoundException('backend.errors.image_not_found');
    }

    const ownerFilter: Record<string, string> = image.productId
      ? { productId: image.productId }
      : image.productVariantId
      ? { productVariantId: image.productVariantId }
      : {
          productVariantGroupOptionId:
            image.productVariantGroupOptionId as string,
        };

    await this.uploadService.deleteImage(imageId);

    const remaining = await this.prisma.image.findMany({
      where: ownerFilter,
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

  async uploadProductImages(opts: {
    productId: string;
    ownerType: 'product' | 'productVariant' | 'productVariantGroupOption';
    ownerId: string;
    files: Express.Multer.File[];
    sortOrders: number[];
  }) {
    const { productId, ownerType, ownerId, files, sortOrders } = opts;

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    if (!product) {
      throw new NotFoundException('backend.errors.product_not_found');
    }

    if (ownerType === 'productVariant') {
      const variant = await this.prisma.productVariant.findFirst({
        where: { id: ownerId, productId },
        select: { id: true },
      });
      if (!variant) {
        throw new NotFoundException('backend.errors.product_variant_not_found');
      }
    } else if (ownerType === 'productVariantGroupOption') {
      const pvgOption = await this.prisma.productVariantGroupOption.findFirst({
        where: { id: ownerId, productVariantGroup: { productId } },
        select: { id: true },
      });
      if (!pvgOption) {
        throw new NotFoundException(
          'backend.errors.product_variant_group_option_not_found'
        );
      }
    } else {
      if (ownerId !== productId) {
        throw new BadRequestException('backend.errors.invalid_owner_id');
      }
    }

    const ownerFieldMap: Record<string, string> = {
      product: 'productId',
      productVariant: 'productVariantId',
      productVariantGroupOption: 'productVariantGroupOptionId',
    };
    const ownerField = ownerFieldMap[ownerType];
    const maxLimit = ownerType === 'productVariantGroupOption' ? 1 : 10;
    const currentCount = await this.prisma.image.count({
      where: { [ownerField]: ownerId },
    });
    if (currentCount + files.length > maxLimit) {
      throw new BadRequestException('backend.errors.files_too_many');
    }

    const results = [];
    for (let i = 0; i < files.length; i++) {
      const result = await this.uploadService.uploadFile(files[i], {
        ownerType,
        ownerId,
        isNeedWebp: true,
        isNeedThumbnail: false,
      });

      await this.prisma.image.update({
        where: { id: result.imageId },
        data: { sortOrder: sortOrders[i] ?? i },
      });

      results.push({ ...result, sortOrder: sortOrders[i] ?? i });
    }

    return results;
  }
}
