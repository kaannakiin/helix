import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Locale } from '../../../core/decorators';
import { TaxonomyService } from './taxonomy.service';
import { TaxonomyLookupQueryDTO, TaxonomyTreeQueryDTO } from './dto';

@ApiTags('Admin - Taxonomy')
@Controller('admin/taxonomy')
export class TaxonomyController {
  constructor(private readonly taxonomyService: TaxonomyService) {}

  @Get('tree')
  @ApiOperation({ summary: 'Get taxonomy tree (lazy load by parentId)' })
  async getTaxonomyTree(
    @Query() query: TaxonomyTreeQueryDTO,
    @Locale() lang: import('@org/prisma/client').Locale,
  ) {
    return this.taxonomyService.getTree({
      q: query.q,
      ids: query.ids?.split(',').filter(Boolean),
      limit: query.limit,
      page: query.page,
      parentId: query.parentId !== undefined ? String(query.parentId) : undefined,
      lang,
    });
  }

  @Get('lookup')
  @ApiOperation({ summary: 'Lookup taxonomy (ID resolve or flat search)' })
  async lookupTaxonomy(
    @Query() query: TaxonomyLookupQueryDTO,
    @Locale() lang: import('@org/prisma/client').Locale,
  ) {
    return this.taxonomyService.lookup({
      q: query.q,
      ids: query.ids?.split(',').filter(Boolean),
      limit: query.limit,
      page: query.page,
      lang,
    });
  }
}
