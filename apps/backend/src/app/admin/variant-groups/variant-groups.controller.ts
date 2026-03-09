import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import type { Locale as LocaleType, Prisma } from '@org/prisma/client';
import type { FilterCondition, SortCondition } from '@org/types/data-query';
import { I18nContext } from 'nestjs-i18n';
import type { Response } from 'express';
import { ContentLocale, Locale } from '../../../core/decorators';
import { ContentLocaleInterceptor } from '../../../core/interceptors/content-locale.interceptor.js';
import { FileValidationPipe } from '../../../core/pipes/file-validation.pipe';
import { buildPrismaQuery } from '../../../core/utils/prisma-query-builder';
import { ExportService } from '../../export/export.service';
import { VariantGroupsService } from './variant-groups.service';
import {
  VariantGroupCheckSlugDTO,
  VariantGroupExportQueryDTO,
  VariantGroupLookupQueryDTO,
  VariantGroupQueryDTO,
  VariantGroupSaveDTO,
} from './dto';
import { VARIANT_GROUP_EXPORT_COLUMNS } from './variant-groups.export-config';

@ApiTags('Admin - Variant Groups')
@Controller('admin/variant-groups')
@UseInterceptors(ContentLocaleInterceptor)
export class VariantGroupsController {
  constructor(
    private readonly variantGroupsService: VariantGroupsService,
    private readonly exportService: ExportService
  ) {}

  @Post('save')
  @ApiOperation({ summary: 'Create or update a variant group' })
  async saveVariantGroup(@Body() body: VariantGroupSaveDTO, @ContentLocale() locale: LocaleType) {
    return this.variantGroupsService.saveVariantGroup(body, locale);
  }

  @Post('query')
  @ApiOperation({ summary: 'Get paginated list of variant groups' })
  async getVariantGroups(@Body() query: VariantGroupQueryDTO, @ContentLocale() locale: LocaleType) {
    return this.variantGroupsService.getVariantGroups(query, locale);
  }

  @Get('lookup')
  @ApiOperation({ summary: 'Lookup variant groups for selection inputs' })
  async lookupVariantGroups(
    @Query() query: VariantGroupLookupQueryDTO,
    @Locale() lang: import('@org/prisma/client').Locale,
  ) {
    return this.variantGroupsService.lookup({
      q: query.q,
      ids: query.ids?.split(',').filter(Boolean),
      exclude: query.exclude?.split(',').filter(Boolean),
      limit: query.limit,
      page: query.page,
      lang,
    });
  }

  @Get('export')
  @ApiOperation({ summary: 'Export variant groups as Excel or CSV' })
  async exportVariantGroups(
    @Query() query: VariantGroupExportQueryDTO,
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

    const columns = VARIANT_GROUP_EXPORT_COLUMNS.map((col) => ({
      ...col,
      header:
        i18n?.translate(col.headerKey as never, { lang }) ?? col.headerKey,
    }));

    const result = await this.exportService.generateExport(
      {
        resourceKey: 'variant-groups',
        columns,
        createDataIterator: (batchSize) =>
          this.variantGroupsService.iterateVariantGroups({
            where: where as Prisma.VariantGroupWhereInput,
            orderBy: orderBy as
              | Prisma.VariantGroupOrderByWithRelationInput
              | Prisma.VariantGroupOrderByWithRelationInput[],
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

  @Post('options/:optionId/image')
  @ApiOperation({ summary: 'Upload image for a variant option or product variant group option' })
  @ApiParam({ name: 'optionId', description: 'VariantOption ID or ProductVariantGroupOption ID' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadOptionImage(
    @Param('optionId') optionId: string,
    @UploadedFile(new FileValidationPipe({ allowedTypes: ['IMAGE'] }))
    file: Express.Multer.File,
    @Body() body: { ownerType: string }
  ) {
    if (!file) {
      throw new BadRequestException('backend.errors.no_files_provided');
    }
    const ownerType = body.ownerType as
      | 'variantOption'
      | 'productVariantGroupOption';
    if (
      ownerType !== 'variantOption' &&
      ownerType !== 'productVariantGroupOption'
    ) {
      throw new BadRequestException('backend.errors.invalid_owner_type');
    }
    return this.variantGroupsService.uploadOptionImage({
      optionId,
      ownerType,
      file,
    });
  }

  @Get('check-slug')
  @ApiOperation({ summary: 'Check if a variant group name already exists (by slug)' })
  async checkSlugExists(@Query() query: VariantGroupCheckSlugDTO) {
    return this.variantGroupsService.checkNameExists({
      name: query.name,
      excludeIds: query.excludeIds?.split(',').filter(Boolean),
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get variant group by ID' })
  @ApiParam({ name: 'id', description: 'Variant Group ID' })
  async getVariantGroupById(@Param('id') id: string, @ContentLocale() locale: LocaleType) {
    return this.variantGroupsService.getVariantGroupById(id, locale);
  }
}
