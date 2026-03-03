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
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@org/prisma/client';
import { CurrentUser, Roles } from '../../../core/decorators';
import { CustomerGroupsService } from './customer-groups.service';
import { CustomerGroupQueryDTO, CustomerGroupSaveDTO } from './dto';

@ApiTags('Admin - Customer Groups')
@Controller('admin/customer-groups')
@Roles(UserRole.ADMIN, UserRole.MODERATOR)
export class CustomerGroupsController {
  constructor(private readonly customerGroupsService: CustomerGroupsService) {}

  @Post('query')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get paginated list of customer groups' })
  async getCustomerGroups(@Body() query: CustomerGroupQueryDTO) {
    return this.customerGroupsService.getCustomerGroups(query);
  }

  @Post('save')
  @ApiOperation({ summary: 'Create or update a customer group' })
  async saveCustomerGroup(@Body() body: CustomerGroupSaveDTO) {
    return this.customerGroupsService.saveCustomerGroup(body);
  }

  @Post(':id/evaluate')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Trigger manual evaluation of a customer group' })
  @ApiParam({ name: 'id', description: 'Customer Group ID' })
  async triggerEvaluation(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string
  ) {
    return this.customerGroupsService.triggerEvaluation(id, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer group by ID' })
  @ApiParam({ name: 'id', description: 'Customer Group ID' })
  async getCustomerGroupById(@Param('id') id: string) {
    return this.customerGroupsService.getCustomerGroupById(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a customer group' })
  @ApiParam({ name: 'id', description: 'Customer Group ID' })
  async deleteCustomerGroup(@Param('id') id: string) {
    return this.customerGroupsService.deleteCustomerGroup(id);
  }
}
