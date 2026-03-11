import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import { AuthzCtx } from '../../../core/decorators/authz-context.decorator';
import { RequireCapability } from '../../../core/decorators/require-capability.decorator';
import { CAPABILITIES, type AuthorizationContext } from '@org/types/authorization';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import type { Prisma } from '@org/prisma/client';
import type { FilterCondition, SortCondition } from '@org/types/data-query';
import { I18nContext } from 'nestjs-i18n';
import type { Response } from 'express';
import { buildPrismaQuery } from '../../../core/utils/prisma-query-builder';
import { ExportService } from '../../export/export.service';
import { OrganizationsService } from './organizations.service';
import { OrganizationExportQueryDTO, OrganizationQueryDTO } from './dto';
import { ORGANIZATION_EXPORT_COLUMNS } from './organizations.export-config';

@ApiTags('Admin - Organizations')
@Controller('admin/organizations')
export class OrganizationsController {
  constructor(
    private readonly organizationsService: OrganizationsService,
    private readonly exportService: ExportService
  ) {}

  @Post('query')
  @RequireCapability(CAPABILITIES.ORGANIZATIONS_READ)
  @ApiOperation({ summary: 'Get paginated list of organizations' })
  async getOrganizations(
    @Body() query: OrganizationQueryDTO,
    @AuthzCtx() authzCtx: AuthorizationContext
  ) {
    return this.organizationsService.getOrganizations(query, authzCtx);
  }

  @Get('export')
  @RequireCapability(CAPABILITIES.ORGANIZATIONS_READ)
  @ApiOperation({ summary: 'Export organizations as Excel or CSV' })
  async exportOrganizations(
    @Query() query: OrganizationExportQueryDTO,
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

    const typedWhere = where as Prisma.OrganizationWhereInput;
    if (!authzCtx.allStores) {
      const storeCondition = { storeId: { in: authzCtx.storeIds } };
      typedWhere.AND = [...(Array.isArray(typedWhere.AND) ? typedWhere.AND : typedWhere.AND ? [typedWhere.AND] : []), storeCondition];
    }

    const lang = I18nContext.current()?.lang ?? 'en';
    const i18n = I18nContext.current();

    const columns = ORGANIZATION_EXPORT_COLUMNS.map((col) => ({
      ...col,
      header:
        i18n?.translate(col.headerKey as never, { lang }) ?? col.headerKey,
    }));

    const result = await this.exportService.generateExport(
      {
        resourceKey: 'organizations',
        columns,
        createDataIterator: (batchSize) =>
          this.organizationsService.iterateOrganizations({
            where: typedWhere,
            orderBy: orderBy as
              | Prisma.OrganizationOrderByWithRelationInput
              | Prisma.OrganizationOrderByWithRelationInput[],
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
  @RequireCapability(CAPABILITIES.ORGANIZATIONS_READ)
  @ApiOperation({ summary: 'Get organization by ID' })
  @ApiParam({ name: 'id', description: 'Organization ID' })
  async getOrganizationById(
    @Param('id') id: string,
    @AuthzCtx() authzCtx: AuthorizationContext
  ) {
    return this.organizationsService.getOrganizationById(id, authzCtx);
  }
}
