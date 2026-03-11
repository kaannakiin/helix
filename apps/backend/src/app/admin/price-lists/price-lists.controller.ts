import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query, Res } from '@nestjs/common';
import { AuthzCtx } from '../../../core/decorators/authz-context.decorator';
import { RequireCapability } from '../../../core/decorators/require-capability.decorator';
import { CAPABILITIES, type AuthorizationContext } from '@org/types/authorization';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import type { Prisma } from '@org/prisma/client';
import type { FilterCondition, SortCondition } from '@org/types/data-query';
import type { Response } from 'express';
import { I18nContext } from 'nestjs-i18n';
import { buildPrismaQuery } from '../../../core/utils/prisma-query-builder';
import { ExportService } from '../../export/export.service';
import { PRICE_LIST_EXPORT_COLUMNS } from './price-lists.export-config';
import { PriceListsService } from './price-lists.service';
import { PriceListExportQueryDTO, PriceListQueryDTO, PriceListSaveDTO } from './dto';

@ApiTags('Admin - Price Lists')
@Controller('admin/price-lists')
export class PriceListsController {
  constructor(
    private readonly priceListsService: PriceListsService,
    private readonly exportService: ExportService
  ) {}

  @Post('query')
  @RequireCapability(CAPABILITIES.PRICE_LISTS_READ)
  @ApiOperation({ summary: 'Get paginated list of price lists' })
  async getPriceLists(
    @Body() query: PriceListQueryDTO,
    @AuthzCtx() authzCtx: AuthorizationContext
  ) {
    return this.priceListsService.getPriceLists(query, authzCtx);
  }

  @Post('save')
  @RequireCapability(CAPABILITIES.PRICE_LISTS_WRITE)
  @ApiOperation({ summary: 'Create or update a price list' })
  async savePriceList(
    @Body() body: PriceListSaveDTO,
    @AuthzCtx() authzCtx: AuthorizationContext
  ) {
    return this.priceListsService.savePriceList(body, authzCtx);
  }

  @Get('export')
  @RequireCapability(CAPABILITIES.PRICE_LISTS_READ)
  @ApiOperation({ summary: 'Export price lists as Excel or CSV' })
  async exportPriceLists(
    @Query() query: PriceListExportQueryDTO,
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

    const typedWhere = where as Prisma.PriceListWhereInput;
    if (!authzCtx.allStores) {
      const storeCondition = { storeId: { in: authzCtx.storeIds } };
      typedWhere.AND = [...(Array.isArray(typedWhere.AND) ? typedWhere.AND : typedWhere.AND ? [typedWhere.AND] : []), storeCondition];
    }

    const lang = I18nContext.current()?.lang ?? 'en';
    const i18n = I18nContext.current();

    const columns = PRICE_LIST_EXPORT_COLUMNS.map((col) => ({
      ...col,
      header:
        i18n?.translate(col.headerKey as never, { lang }) ?? col.headerKey,
    }));

    const result = await this.exportService.generateExport(
      {
        resourceKey: 'price-lists',
        columns,
        createDataIterator: (batchSize) =>
          this.priceListsService.iteratePriceLists({
            where: typedWhere,
            orderBy: orderBy as
              | Prisma.PriceListOrderByWithRelationInput
              | Prisma.PriceListOrderByWithRelationInput[],
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

  @Get(':id')
  @RequireCapability(CAPABILITIES.PRICE_LISTS_READ)
  @ApiOperation({ summary: 'Get price list by ID' })
  @ApiParam({ name: 'id', description: 'Price List ID' })
  async getPriceListById(
    @Param('id') id: string,
    @AuthzCtx() authzCtx: AuthorizationContext
  ) {
    return this.priceListsService.getPriceListById(id, authzCtx);
  }

  @Delete(':id')
  @RequireCapability(CAPABILITIES.PRICE_LISTS_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a price list' })
  @ApiParam({ name: 'id', description: 'Price List ID' })
  async deletePriceList(
    @Param('id') id: string,
    @AuthzCtx() authzCtx: AuthorizationContext
  ) {
    return this.priceListsService.deletePriceList(id, authzCtx);
  }
}
