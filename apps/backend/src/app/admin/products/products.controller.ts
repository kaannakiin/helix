import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import type { Locale as LocaleType, Prisma } from '@org/prisma/client';
import { UserRole } from '@org/prisma/client';
import type { FilterCondition, SortCondition } from '@org/types/data-query';
import type { Response } from 'express';
import { I18nContext } from 'nestjs-i18n';
import { ContentLocale, Locale, Roles } from '../../../core/decorators';
import { ContentLocaleInterceptor } from '../../../core/interceptors/content-locale.interceptor.js';
import { FileValidationPipe } from '../../../core/pipes/file-validation.pipe';
import { buildPrismaQuery } from '../../../core/utils/prisma-query-builder';
import { ExportService } from '../../export/export.service';
import { ProductExportQueryDTO, ProductQueryDTO, ProductSaveDTO } from './dto';
import { PRODUCT_EXPORT_COLUMNS } from './products.export-config';
import { ProductsService } from './products.service';

@ApiTags('Admin - Products')
@Controller('admin/products')
@Roles(UserRole.ADMIN, UserRole.MODERATOR)
@UseInterceptors(ContentLocaleInterceptor)
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly exportService: ExportService
  ) {}

  @Post('query')
  @ApiOperation({ summary: 'Get paginated list of products' })
  async getProducts(@Body() query: ProductQueryDTO, @ContentLocale() locale: LocaleType) {
    return this.productsService.getProducts(query, locale);
  }

  @Post('save')
  @ApiOperation({ summary: 'Create or update a product (upsert by uniqueId)' })
  async saveProduct(@Body() body: ProductSaveDTO, @ContentLocale() locale: LocaleType) {
    return this.productsService.saveProduct(body, locale);
  }

  @Post(':id/images')
  @ApiOperation({ summary: 'Upload images for a product or product variant' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadProductImages(
    @Param('id') productId: string,
    @UploadedFiles(new FileValidationPipe({ allowedTypes: ['IMAGE', 'VIDEO'] }))
    files: Express.Multer.File[],
    @Body() body: { ownerType: string; ownerId: string; sortOrders?: string }
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('backend.errors.no_files_provided');
    }
    const ownerType = body.ownerType as
      | 'product'
      | 'productVariant'
      | 'productVariantGroupOption';
    if (
      ownerType !== 'product' &&
      ownerType !== 'productVariant' &&
      ownerType !== 'productVariantGroupOption'
    ) {
      throw new BadRequestException('backend.errors.invalid_owner_type');
    }
    const sortOrders: number[] = body.sortOrders
      ? JSON.parse(body.sortOrders)
      : files.map((_, i) => i);

    return this.productsService.uploadProductImages({
      productId,
      ownerType,
      ownerId: body.ownerId,
      files,
      sortOrders,
    });
  }

  @Delete(':id/images/:imageId')
  @ApiOperation({ summary: 'Delete a product image' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiParam({ name: 'imageId', description: 'Image ID' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteProductImage(
    @Param('id') productId: string,
    @Param('imageId') imageId: string
  ) {
    return this.productsService.deleteProductImage(productId, imageId);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export products as Excel or CSV' })
  async exportProducts(
    @Query() query: ProductExportQueryDTO,
    @Locale() locale: string,
    @Res() res: Response
  ) {
    const { where, orderBy } = buildPrismaQuery({
      page: 1,
      limit: 1,
      filters: query.filters as Record<string, FilterCondition> | undefined,
      sort: query.sort as SortCondition[] | undefined,
      defaultSort: { field: 'createdAt', order: 'desc' },
    });

    const i18n = I18nContext.current();

    const columns = PRODUCT_EXPORT_COLUMNS.map((col) => ({
      ...col,
      header:
        i18n?.translate(col.headerKey as never, { lang: locale }) ??
        col.headerKey,
    }));

    const result = await this.exportService.generateExport(
      {
        resourceKey: 'products',
        columns,
        createDataIterator: (batchSize) =>
          this.productsService.iterateProducts({
            where: where as Prisma.ProductWhereInput,
            orderBy: orderBy as
              | Prisma.ProductOrderByWithRelationInput
              | Prisma.ProductOrderByWithRelationInput[],
            batchSize,
            locale: locale.toUpperCase() as LocaleType,
          }),
      },
      {
        format: query.format,
        columns: query.columns,
        headers: query.headers,
        filename: query.filename,
        locale,
        localeStrings: {
          booleanYes:
            i18n?.translate('backend.export.boolean_yes' as never, {
              lang: locale,
            }) ?? 'Yes',
          booleanNo:
            i18n?.translate('backend.export.boolean_no' as never, {
              lang: locale,
            }) ?? 'No',
        },
      }
    );

    res.setHeader('Content-Type', result.contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.filename}"`
    );
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    result.stream.pipe(res);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  async getProductById(@Param('id') id: string, @ContentLocale() locale: LocaleType) {
    return this.productsService.getProductById(id, locale);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a product' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  async deleteProduct(@Param('id') id: string) {
    return this.productsService.deleteProduct(id);
  }
}
