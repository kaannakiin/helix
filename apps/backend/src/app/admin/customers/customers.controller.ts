import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@org/prisma/client';
import type { Prisma } from '@org/prisma/client';
import type { FilterCondition, SortCondition } from '@org/types/data-query';
import { I18nContext } from 'nestjs-i18n';
import type { Response } from 'express';
import { Roles } from '../../../core/decorators';
import { buildPrismaQuery } from '../../../core/utils/prisma-query-builder';
import { ExportService } from '../../export/export.service';
import { CustomersService } from './customers.service';
import { CustomerExportQueryDTO, UserQueryDTO } from './dto';
import { CUSTOMER_EXPORT_COLUMNS } from './customers.export-config';

@ApiTags('Admin - Customers')
@Controller('admin/customers')
@Roles(UserRole.ADMIN, UserRole.MODERATOR)
export class CustomersController {
  constructor(
    private readonly customersService: CustomersService,
    private readonly exportService: ExportService
  ) {}

  @Post('query')
  @ApiOperation({ summary: 'Get paginated list of users' })
  async getUsers(@Body() query: UserQueryDTO) {
    return this.customersService.getUsers(query);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export customers as Excel or CSV' })
  async exportUsers(
    @Query() query: CustomerExportQueryDTO,
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

    const columns = CUSTOMER_EXPORT_COLUMNS.map((col) => ({
      ...col,
      header:
        i18n?.translate(col.headerKey as never, { lang }) ?? col.headerKey,
    }));

    const result = await this.exportService.generateExport(
      {
        resourceKey: 'customers',
        columns,
        createDataIterator: (batchSize) =>
          this.customersService.iterateUsers({
            where: where as Prisma.UserWhereInput,
            orderBy: orderBy as
              | Prisma.UserOrderByWithRelationInput
              | Prisma.UserOrderByWithRelationInput[],
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
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  async getUserById(@Param('id') id: string) {
    return this.customersService.getUserById(id);
  }
}
