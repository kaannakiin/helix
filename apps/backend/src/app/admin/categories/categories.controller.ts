import {
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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import type { Locale as LocaleType, Prisma } from '@org/prisma/client';
import type { FilterCondition, SortCondition } from '@org/types/data-query';
import type { Response } from 'express';
import { I18nContext } from 'nestjs-i18n';
import { ContentLocale, Locale } from '../../../core/decorators';
import { AuthzCtx } from '../../../core/decorators/authz-context.decorator';
import { RequireCapability } from '../../../core/decorators/require-capability.decorator';
import { CAPABILITIES, type AuthorizationContext } from '@org/types/authorization';
import { ContentLocaleInterceptor } from '../../../core/interceptors/content-locale.interceptor.js';
import { FileValidationPipe } from '../../../core/pipes/file-validation.pipe';
import { buildPrismaQuery } from '../../../core/utils/prisma-query-builder';
import { ExportService } from '../../export/export.service';
import { CATEGORY_EXPORT_COLUMNS } from './categories.export-config';
import { CategoriesService } from './categories.service';
import {
  CategoryExportQueryDTO,
  CategoryLookupQueryDTO,
  CategoryQueryDTO,
  CategorySaveDTO,
} from './dto';

@ApiTags('Admin - Categories')
@Controller('admin/categories')
@UseInterceptors(ContentLocaleInterceptor)
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly exportService: ExportService
  ) {}

  @Post('query')
  @RequireCapability(CAPABILITIES.CATEGORIES_READ)
  @ApiOperation({ summary: 'Get paginated list of categories' })
  async getCategories(
    @Body() query: CategoryQueryDTO,
    @ContentLocale() locale: LocaleType,
    @AuthzCtx() authzCtx: AuthorizationContext
  ) {
    return this.categoriesService.getCategories(query, locale, authzCtx);
  }

  @Get('lookup')
  @RequireCapability(CAPABILITIES.CATEGORIES_READ)
  @ApiOperation({ summary: 'Lookup categories for selection inputs' })
  async lookupCategories(
    @Query() query: CategoryLookupQueryDTO,
    @Locale() lang: import('@org/prisma/client').Locale,
    @AuthzCtx() authzCtx: AuthorizationContext
  ) {
    return this.categoriesService.lookup({
      q: query.q,
      ids: query.ids?.split(',').filter(Boolean),
      limit: query.limit,
      page: query.page,
      lang,
      authzCtx,
    });
  }

  @Get('tree')
  @RequireCapability(CAPABILITIES.CATEGORIES_READ)
  @ApiOperation({
    summary: 'Get categories as a tree (top-level parents with children)',
  })
  async getCategoryTree(
    @Query() query: CategoryLookupQueryDTO,
    @Locale() lang: import('@org/prisma/client').Locale,
    @AuthzCtx() authzCtx: AuthorizationContext
  ) {
    return this.categoriesService.getTree({
      q: query.q,
      ids: query.ids?.split(',').filter(Boolean),
      parentId: query.parentId,
      limit: query.limit,
      page: query.page,
      lang,
      authzCtx,
    });
  }

  @Get('export')
  @RequireCapability(CAPABILITIES.CATEGORIES_READ)
  @ApiOperation({ summary: 'Export categories as Excel or CSV' })
  async exportCategories(
    @Query() query: CategoryExportQueryDTO,
    @Res() res: Response,
    @AuthzCtx() authzCtx: AuthorizationContext
  ) {
    const { where, orderBy } = buildPrismaQuery({
      page: 1,
      limit: 1,
      filters: query.filters as Record<string, FilterCondition> | undefined,
      sort: query.sort as SortCondition[] | undefined,
      defaultSort: { field: 'createdAt', order: 'desc' },
    });

    const typedWhere = where as Prisma.CategoryWhereInput;
    if (!authzCtx.allStores) {
      const storeCondition: Prisma.CategoryWhereInput = {
        stores: { some: { storeId: { in: authzCtx.storeIds } } },
      };
      typedWhere.AND = [...(Array.isArray(typedWhere.AND) ? typedWhere.AND : typedWhere.AND ? [typedWhere.AND] : []), storeCondition];
    }

    const lang = I18nContext.current()?.lang ?? 'en';
    const i18n = I18nContext.current();

    const columns = CATEGORY_EXPORT_COLUMNS.map((col) => ({
      ...col,
      header:
        i18n?.translate(col.headerKey as never, { lang }) ?? col.headerKey,
    }));

    const result = await this.exportService.generateExport(
      {
        resourceKey: 'categories',
        columns,
        createDataIterator: (batchSize) =>
          this.categoriesService.iterateCategories({
            where: typedWhere,
            orderBy: orderBy as
              | Prisma.CategoryOrderByWithRelationInput
              | Prisma.CategoryOrderByWithRelationInput[],
            batchSize,
            locale: lang.toUpperCase() as LocaleType,
          }),
      },
      {
        format: query.format,
        columns: query.columns,
        headers: query.headers,
        filename: query.filename,
        locale: lang,
        localeStrings: {
          booleanYes:
            i18n?.translate('backend.export.boolean_yes' as never, { lang }) ??
            'Yes',
          booleanNo:
            i18n?.translate('backend.export.boolean_no' as never, { lang }) ??
            'No',
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

  @Post('save')
  @RequireCapability(CAPABILITIES.CATEGORIES_WRITE)
  @ApiOperation({ summary: 'Create or update a category (upsert by uniqueId)' })
  async saveCategory(
    @Body() body: CategorySaveDTO,
    @ContentLocale() locale: LocaleType,
    @AuthzCtx() authzCtx: AuthorizationContext
  ) {
    return this.categoriesService.saveCategory(body, locale, authzCtx);
  }

  @Post(':id/images')
  @RequireCapability(CAPABILITIES.CATEGORIES_WRITE)
  @ApiOperation({ summary: 'Upload an image for a category' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadCategoryImage(
    @Param('id') id: string,
    @UploadedFile(
      new FileValidationPipe({
        allowedTypes: ['IMAGE'],
        maxSize: 5 * 1024 * 1024,
      })
    )
    file: Express.Multer.File,
    @AuthzCtx() authzCtx: AuthorizationContext
  ) {
    return this.categoriesService.uploadCategoryImage(id, file, authzCtx);
  }

  @Delete(':id/images/:imageId')
  @RequireCapability(CAPABILITIES.CATEGORIES_WRITE)
  @ApiOperation({ summary: 'Delete a category image' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiParam({ name: 'imageId', description: 'Image ID' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCategoryImage(
    @Param('id') categoryId: string,
    @Param('imageId') imageId: string,
    @AuthzCtx() authzCtx: AuthorizationContext
  ) {
    return this.categoriesService.deleteCategoryImage(categoryId, imageId, authzCtx);
  }

  @Get(':id')
  @RequireCapability(CAPABILITIES.CATEGORIES_READ)
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  async getCategoryById(
    @Param('id') id: string,
    @ContentLocale() locale: LocaleType,
    @AuthzCtx() authzCtx: AuthorizationContext
  ) {
    return this.categoriesService.getCategoryById(id, locale, authzCtx);
  }
}
