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
  @ApiOperation({ summary: 'List assignments for a price list' })
  async list(@Param('priceListId') priceListId: string) {
    return this.service.list(priceListId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add an assignment to a price list' })
  async create(
    @Param('priceListId') priceListId: string,
    @Body() body: PriceListAssignmentCreateDTO
  ) {
    return this.service.create(priceListId, body);
  }

  @Patch(':assignmentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a price list assignment' })
  async update(
    @Param('priceListId') priceListId: string,
    @Param('assignmentId') assignmentId: string,
    @Body() body: PriceListAssignmentUpdateDTO
  ) {
    return this.service.update(priceListId, assignmentId, body);
  }

  @Delete(':assignmentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove an assignment from a price list' })
  async delete(
    @Param('priceListId') priceListId: string,
    @Param('assignmentId') assignmentId: string
  ) {
    return this.service.delete(priceListId, assignmentId);
  }
}
