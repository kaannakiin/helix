import { Body, Controller, Delete, Get, Param, Post, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@org/prisma/client';
import type { Prisma } from '@org/prisma/client';
import type { FilterCondition, SortCondition } from '@org/types/data-query';
import { I18nContext } from 'nestjs-i18n';
import type { Response } from 'express';
import { Locale, Roles } from '../../../core/decorators';
import { buildPrismaQuery } from '../../../core/utils/prisma-query-builder';
import { ExportService } from '../../export/export.service';
import { TagGroupsService } from './tag-groups.service';
import {
  TagBulkDeleteDTO,
  TagChildrenQueryDTO,
  TagGroupExportQueryDTO,
  TagGroupQueryDTO,
  TagGroupSaveDTO,
  TagLookupQueryDTO,
  TagSaveDTO,
} from './dto';
import { TAG_GROUP_EXPORT_COLUMNS } from './tag-groups.export-config';

@ApiTags('Admin - Tag Groups')
@Controller('admin/tag-groups')
@Roles(UserRole.ADMIN, UserRole.MODERATOR)
export class TagGroupsController {
  constructor(
    private readonly tagGroupsService: TagGroupsService,
    private readonly exportService: ExportService
  ) {}

  @Post('query')
  @ApiOperation({ summary: 'Get paginated list of tag groups' })
  async getTagGroups(@Body() query: TagGroupQueryDTO) {
    return this.tagGroupsService.getTagGroups(query);
  }

  @Get('tags/lookup')
  @ApiOperation({ summary: 'Lookup tags for selection inputs (grouped by tag group)' })
  async lookupTags(
    @Query() query: TagLookupQueryDTO,
    @Locale() lang: import('@org/prisma/client').Locale,
  ) {
    return this.tagGroupsService.lookupTags({
      q: query.q,
      ids: query.ids?.split(',').filter(Boolean),
      limit: query.limit,
      page: query.page,
      lang,
    });
  }

  @Get('tags/tree')
  @ApiOperation({ summary: 'Get tags as a tree (tag groups with their tags)' })
  async getTagTree(
    @Query() query: TagLookupQueryDTO,
    @Locale() lang: import('@org/prisma/client').Locale,
  ) {
    return this.tagGroupsService.getTagTree({
      q: query.q,
      ids: query.ids?.split(',').filter(Boolean),
      tagGroupId: query.tagGroupId,
      limit: query.limit,
      page: query.page,
      lang,
    });
  }

  @Get('export')
  @ApiOperation({ summary: 'Export tag groups as Excel or CSV' })
  async exportTagGroups(
    @Query() query: TagGroupExportQueryDTO,
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

    const columns = TAG_GROUP_EXPORT_COLUMNS.map((col) => ({
      ...col,
      header:
        i18n?.translate(col.headerKey as never, { lang }) ?? col.headerKey,
    }));

    const result = await this.exportService.generateExport(
      {
        resourceKey: 'tag-groups',
        columns,
        createDataIterator: (batchSize) =>
          this.tagGroupsService.iterateTagGroups({
            where: where as Prisma.TagGroupWhereInput,
            orderBy: orderBy as
              | Prisma.TagGroupOrderByWithRelationInput
              | Prisma.TagGroupOrderByWithRelationInput[],
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

  @Post('save')
  @ApiOperation({ summary: 'Create or update a tag group (upsert by id)' })
  async saveTagGroup(@Body() body: TagGroupSaveDTO) {
    return this.tagGroupsService.saveTagGroup(body);
  }

  @Post(':id/tags/save')
  @ApiOperation({ summary: 'Create or update a single tag' })
  @ApiParam({ name: 'id', description: 'Tag Group ID' })
  async saveTag(
    @Param('id') tagGroupId: string,
    @Body() body: TagSaveDTO,
  ) {
    return this.tagGroupsService.saveTag(tagGroupId, body);
  }

  @Delete(':id/tags/:tagId')
  @ApiOperation({ summary: 'Delete a single tag' })
  @ApiParam({ name: 'id', description: 'Tag Group ID' })
  @ApiParam({ name: 'tagId', description: 'Tag ID' })
  async deleteTag(@Param('tagId') tagId: string) {
    return this.tagGroupsService.deleteTag(tagId);
  }

  @Post(':id/tags/bulk-delete')
  @ApiOperation({ summary: 'Delete multiple tags at once' })
  @ApiParam({ name: 'id', description: 'Tag Group ID' })
  async deleteTags(@Body() body: TagBulkDeleteDTO) {
    return this.tagGroupsService.deleteTags(body.ids);
  }

  @Get(':id/tags')
  @ApiOperation({ summary: 'Get direct child tags of a tag group (lazy load by parentTagId)' })
  @ApiParam({ name: 'id', description: 'Tag Group ID' })
  async getTagChildren(
    @Param('id') id: string,
    @Query() query: TagChildrenQueryDTO,
  ) {
    return this.tagGroupsService.getTagChildren(id, query.parentTagId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tag group by ID' })
  @ApiParam({ name: 'id', description: 'Tag Group ID' })
  async getTagGroupById(@Param('id') id: string) {
    return this.tagGroupsService.getTagGroupById(id);
  }
}
