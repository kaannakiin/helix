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
import type { Prisma } from '@org/prisma/client';
import { UserRole } from '@org/prisma/client';
import type { FilterCondition, SortCondition } from '@org/types/data-query';
import type { Response } from 'express';
import { I18nContext } from 'nestjs-i18n';
import { Locale, Roles } from '../../../core/decorators';
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
@Roles(UserRole.ADMIN, UserRole.MODERATOR)
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly exportService: ExportService
  ) {}

  @Post('query')
  @ApiOperation({ summary: 'Get paginated list of categories' })
  async getCategories(@Body() query: CategoryQueryDTO) {
    return this.categoriesService.getCategories(query);
  }

  @Get('lookup')
  @ApiOperation({ summary: 'Lookup categories for selection inputs' })
  async lookupCategories(
    @Query() query: CategoryLookupQueryDTO,
    @Locale() lang: import('@org/prisma/client').Locale
  ) {
    return this.categoriesService.lookup({
      q: query.q,
      ids: query.ids?.split(',').filter(Boolean),
      limit: query.limit,
      page: query.page,
      lang,
    });
  }

  @Get('tree')
  @ApiOperation({
    summary: 'Get categories as a tree (top-level parents with children)',
  })
  async getCategoryTree(
    @Query() query: CategoryLookupQueryDTO,
    @Locale() lang: import('@org/prisma/client').Locale
  ) {
    return this.categoriesService.getTree({
      q: query.q,
      ids: query.ids?.split(',').filter(Boolean),
      parentId: query.parentId,
      limit: query.limit,
      page: query.page,
      lang,
    });
  }

  @Get('export')
  @ApiOperation({ summary: 'Export categories as Excel or CSV' })
  async exportCategories(
    @Query() query: CategoryExportQueryDTO,
    @Res() res: Response
  ) {
    const { where, orderBy } = buildPrismaQuery({
      page: 1,
      limit: 1,
      filters: query.filters as Record<string, FilterCondition> | undefined,
      sort: query.sort as SortCondition[] | undefined,
      defaultSort: { field: 'createdAt', order: 'desc' },
    });

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
            where: where as Prisma.CategoryWhereInput,
            orderBy: orderBy as
              | Prisma.CategoryOrderByWithRelationInput
              | Prisma.CategoryOrderByWithRelationInput[],
            batchSize,
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
  @ApiOperation({ summary: 'Create or update a category (upsert by uniqueId)' })
  async saveCategory(@Body() body: CategorySaveDTO) {
    return this.categoriesService.saveCategory(body);
  }

  @Post(':id/images')
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
    file: Express.Multer.File
  ) {
    return this.categoriesService.uploadCategoryImage(id, file);
  }

  @Delete(':id/images/:imageId')
  @ApiOperation({ summary: 'Delete a category image' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiParam({ name: 'imageId', description: 'Image ID' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCategoryImage(
    @Param('id') categoryId: string,
    @Param('imageId') imageId: string
  ) {
    return this.categoriesService.deleteCategoryImage(categoryId, imageId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  async getCategoryById(@Param('id') id: string) {
    return this.categoriesService.getCategoryById(id);
  }
}
