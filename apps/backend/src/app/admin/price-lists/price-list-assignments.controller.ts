import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthzCtx } from '../../../core/decorators/authz-context.decorator';
import { RequireCapability } from '../../../core/decorators/require-capability.decorator';
import { CAPABILITIES, type AuthorizationContext } from '@org/types/authorization';
import {
  PriceListAssignmentCreateDTO,
  PriceListAssignmentUpdateDTO,
} from './dto/index.js';
import { PriceListAssignmentsService } from './price-list-assignments.service.js';

@ApiTags('Admin - Price List Assignments')
@Controller('admin/price-lists/:priceListId/assignments')
export class PriceListAssignmentsController {
  constructor(private readonly service: PriceListAssignmentsService) {}

  @Get()
  @RequireCapability(CAPABILITIES.PRICE_LISTS_READ)
  @ApiOperation({ summary: 'List assignments for a price list' })
  async list(
    @Param('priceListId') priceListId: string,
    @AuthzCtx() authzCtx: AuthorizationContext
  ) {
    return this.service.list(priceListId, authzCtx);
  }

  @Post()
  @RequireCapability(CAPABILITIES.PRICE_LISTS_WRITE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add an assignment to a price list' })
  async create(
    @Param('priceListId') priceListId: string,
    @Body() body: PriceListAssignmentCreateDTO,
    @AuthzCtx() authzCtx: AuthorizationContext
  ) {
    return this.service.create(priceListId, body, authzCtx);
  }

  @Patch(':assignmentId')
  @RequireCapability(CAPABILITIES.PRICE_LISTS_WRITE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a price list assignment' })
  async update(
    @Param('priceListId') priceListId: string,
    @Param('assignmentId') assignmentId: string,
    @Body() body: PriceListAssignmentUpdateDTO,
    @AuthzCtx() authzCtx: AuthorizationContext
  ) {
    return this.service.update(priceListId, assignmentId, body, authzCtx);
  }

  @Delete(':assignmentId')
  @RequireCapability(CAPABILITIES.PRICE_LISTS_WRITE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove an assignment from a price list' })
  async delete(
    @Param('priceListId') priceListId: string,
    @Param('assignmentId') assignmentId: string,
    @AuthzCtx() authzCtx: AuthorizationContext
  ) {
    return this.service.delete(priceListId, assignmentId, authzCtx);
  }
}
