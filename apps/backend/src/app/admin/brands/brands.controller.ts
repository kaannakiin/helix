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
import type { Locale, Prisma } from '@org/prisma/client';
import type { FilterCondition, SortCondition } from '@org/types/data-query';
import type { Response } from 'express';
import { I18nContext } from 'nestjs-i18n';
import { ContentLocale } from '../../../core/decorators/index.js';
import { LocaleDecorator } from '../../../core/decorators/locale.decorator';
import { ContentLocaleInterceptor } from '../../../core/interceptors/content-locale.interceptor.js';
import { FileValidationPipe } from '../../../core/pipes/file-validation.pipe';
import { buildPrismaQuery } from '../../../core/utils/prisma-query-builder';
import { ExportService } from '../../export/export.service';
import { BRAND_EXPORT_COLUMNS } from './brands.export-config';
import { BrandsService } from './brands.service';
import {
  BrandExportQueryDTO,
  BrandLookupQueryDTO,
  BrandQueryDTO,
  BrandSaveDTO,
} from './dto';

@ApiTags('Admin - Brands')
@Controller('admin/brands')
@UseInterceptors(ContentLocaleInterceptor)
export class BrandsController {
  constructor(
    private readonly brandsService: BrandsService,
    private readonly exportService: ExportService
  ) {}

  @Post('query')
  @ApiOperation({ summary: 'Get paginated list of brands' })
  async getBrands(
    @Body() query: BrandQueryDTO,
    @ContentLocale() locale: Locale
  ) {
    return this.brandsService.getBrands(query, locale);
  }

  @Post('save')
  @ApiOperation({ summary: 'Create or update a brand' })
  async saveBrand(@Body() body: BrandSaveDTO, @ContentLocale() locale: Locale) {
    return this.brandsService.saveBrand(body, locale);
  }

  @Get('lookup')
  @ApiOperation({ summary: 'Lookup brands for selection inputs' })
  async lookupBrands(
    @Query() query: BrandLookupQueryDTO,
    @LocaleDecorator() lang: Locale
  ) {
    return this.brandsService.lookup({
      q: query.q,
      ids: query.ids?.split(',').filter(Boolean),
      limit: query.limit,
      page: query.page,
      lang,
    });
  }

  @Get('export')
  @ApiOperation({ summary: 'Export brands as Excel or CSV' })
  async exportBrands(
    @Query() query: BrandExportQueryDTO,
    @Res() res: Response,
    @ContentLocale() locale: Locale
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

    const columns = BRAND_EXPORT_COLUMNS.map((col) => ({
      ...col,
      header:
        i18n?.translate(col.headerKey as never, { lang }) ?? col.headerKey,
    }));

    const result = await this.exportService.generateExport(
      {
        resourceKey: 'brands',
        columns,
        createDataIterator: (batchSize) =>
          this.brandsService.iterateBrands({
            where: where as Prisma.BrandWhereInput,
            orderBy: orderBy as
              | Prisma.BrandOrderByWithRelationInput
              | Prisma.BrandOrderByWithRelationInput[],
            batchSize,
            locale,
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

  @Post(':id/images')
  @ApiOperation({ summary: 'Upload an image for a brand' })
  @ApiParam({ name: 'id', description: 'Brand ID' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadBrandImage(
    @Param('id') id: string,
    @UploadedFile(
      new FileValidationPipe({
        allowedTypes: ['IMAGE'],
        maxSize: 5 * 1024 * 1024,
      })
    )
    file: Express.Multer.File
  ) {
    return this.brandsService.uploadBrandImage(id, file);
  }

  @Delete(':id/images/:imageId')
  @ApiOperation({ summary: 'Delete a brand image' })
  @ApiParam({ name: 'id', description: 'Brand ID' })
  @ApiParam({ name: 'imageId', description: 'Image ID' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBrandImage(
    @Param('id') brandId: string,
    @Param('imageId') imageId: string
  ) {
    return this.brandsService.deleteBrandImage(brandId, imageId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get brand by ID' })
  @ApiParam({ name: 'id', description: 'Brand ID' })
  async getBrandById(@Param('id') id: string, @ContentLocale() locale: Locale) {
    return this.brandsService.getBrandById(id, locale);
  }
}
