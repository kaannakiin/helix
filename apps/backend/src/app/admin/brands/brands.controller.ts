import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import type { Locale, Prisma } from '@org/prisma/client';
import { UserRole } from '@org/prisma/client';
import type { FilterCondition, SortCondition } from '@org/types/data-query';
import type { Response } from 'express';
import { I18nContext } from 'nestjs-i18n';
import { Roles } from '../../../core/decorators';
import { LocaleDecorator } from '../../../core/decorators/locale.decorator';
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
@Roles(UserRole.ADMIN, UserRole.MODERATOR)
export class BrandsController {
  constructor(
    private readonly brandsService: BrandsService,
    private readonly exportService: ExportService
  ) {}

  @Post('query')
  @ApiOperation({ summary: 'Get paginated list of brands' })
  async getBrands(@Body() query: BrandQueryDTO) {
    return this.brandsService.getBrands(query);
  }

  @Post('save')
  @ApiOperation({ summary: 'Create or update a brand' })
  async saveBrand(@Body() body: BrandSaveDTO) {
    return this.brandsService.saveBrand(body);
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
            i18n?.translate('common.export.boolean_yes' as never, { lang }) ??
            'Yes',
          booleanNo:
            i18n?.translate('common.export.boolean_no' as never, { lang }) ??
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

  @Get(':id')
  @ApiOperation({ summary: 'Get brand by ID' })
  @ApiParam({ name: 'id', description: 'Brand ID' })
  async getBrandById(@Param('id') id: string) {
    return this.brandsService.getBrandById(id);
  }
}
