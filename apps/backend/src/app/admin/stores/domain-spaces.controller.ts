import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequireCapability } from '../../../core/decorators/require-capability.decorator';
import { CAPABILITIES } from '@org/types/authorization';
import { DomainSpaceDTO } from './dto/index.js';
import { DomainSpacesService } from './domain-spaces.service.js';

@ApiTags('Admin - Domain Spaces')
@Controller('admin/domain-spaces')
export class DomainSpacesController {
  constructor(private readonly domainSpacesService: DomainSpacesService) {}

  @Get()
  @RequireCapability(CAPABILITIES.STORES_READ)
  @ApiOperation({ summary: 'List domain spaces for the current installation' })
  async list() {
    return this.domainSpacesService.list();
  }

  @Post()
  @RequireCapability(CAPABILITIES.STORES_WRITE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a domain space' })
  async create(@Body() body: DomainSpaceDTO) {
    return this.domainSpacesService.create(body);
  }

  @Post(':domainSpaceId/verify-ownership')
  @RequireCapability(CAPABILITIES.STORES_WRITE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify domain ownership for a domain space' })
  async verifyOwnership(@Param('domainSpaceId') domainSpaceId: string) {
    return this.domainSpacesService.verifyOwnership(domainSpaceId);
  }

  @Post(':domainSpaceId/verify-apex-routing')
  @RequireCapability(CAPABILITIES.STORES_WRITE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify apex routing for a domain space' })
  async verifyApexRouting(@Param('domainSpaceId') domainSpaceId: string) {
    return this.domainSpacesService.verifyApexRouting(domainSpaceId);
  }

  @Post(':domainSpaceId/verify-wildcard-routing')
  @RequireCapability(CAPABILITIES.STORES_WRITE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify wildcard routing for a domain space' })
  async verifyWildcardRouting(@Param('domainSpaceId') domainSpaceId: string) {
    return this.domainSpacesService.verifyWildcardRouting(domainSpaceId);
  }

  @Delete(':domainSpaceId')
  @RequireCapability(CAPABILITIES.STORES_WRITE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a domain space and its bindings' })
  async delete(@Param('domainSpaceId') domainSpaceId: string) {
    await this.domainSpacesService.delete(domainSpaceId);
  }
}
