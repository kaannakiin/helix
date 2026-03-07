import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Locale, Prisma } from '@org/prisma/client';
import { UserRole } from '@org/prisma/client';
import type { FilterCondition, SortCondition } from '@org/types/data-query';
import type { Response } from 'express';
import { I18nContext } from 'nestjs-i18n';
import { ContentLocale, Roles } from '../../../core/decorators/index.js';
import { LocaleDecorator } from '../../../core/decorators/locale.decorator';
import { ContentLocaleInterceptor } from '../../../core/interceptors/content-locale.interceptor.js';
import { buildPrismaQuery } from '../../../core/utils/prisma-query-builder';
import { ExportService } from '../../export/export.service';
import { WAREHOUSE_EXPORT_COLUMNS } from './warehouses.export-config';
import { WarehousesService } from './warehouses.service';
import {
  WarehouseExportQueryDTO,
  WarehouseLookupQueryDTO,
  WarehouseQueryDTO,
} from './dto';

@ApiTags('Admin - Warehouses')
@Controller('admin/warehouses')
@Roles(UserRole.ADMIN, UserRole.MODERATOR)
@UseInterceptors(ContentLocaleInterceptor)
export class WarehousesController {
  constructor(
    private readonly warehousesService: WarehousesService,
    private readonly exportService: ExportService
  ) {}

  @Post('query')
  @ApiOperation({ summary: 'Get paginated list of warehouses' })
  async getWarehouses(
    @Body() query: WarehouseQueryDTO,
    @ContentLocale() locale: Locale
  ) {
    return this.warehousesService.getWarehouses(query, locale);
  }

  @Get('lookup')
  @ApiOperation({ summary: 'Lookup warehouses for selection inputs' })
  async lookupWarehouses(
    @Query() query: WarehouseLookupQueryDTO,
    @LocaleDecorator() lang: Locale
  ) {
    return this.warehousesService.lookup({
      q: query.q,
      ids: query.ids?.split(',').filter(Boolean),
      limit: query.limit,
      page: query.page,
      lang,
    });
  }

  @Get('export')
  @ApiOperation({ summary: 'Export warehouses as Excel or CSV' })
  async exportWarehouses(
    @Query() query: WarehouseExportQueryDTO,
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

    const columns = WAREHOUSE_EXPORT_COLUMNS.map((col) => ({
      ...col,
      header:
        i18n?.translate(col.headerKey as never, { lang }) ?? col.headerKey,
    }));

    const result = await this.exportService.generateExport(
      {
        resourceKey: 'warehouses',
        columns,
        createDataIterator: (batchSize) =>
          this.warehousesService.iterateWarehouses({
            where: where as Prisma.WarehouseWhereInput,
            orderBy: orderBy as
              | Prisma.WarehouseOrderByWithRelationInput
              | Prisma.WarehouseOrderByWithRelationInput[],
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
}
