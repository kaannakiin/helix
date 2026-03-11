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
import { CurrentUser } from '../../../core/decorators';
import { AuthzCtx } from '../../../core/decorators/authz-context.decorator';
import { RequireCapability } from '../../../core/decorators/require-capability.decorator';
import { CAPABILITIES, type AuthorizationContext } from '@org/types/authorization';
import { CustomerGroupsService } from './customer-groups.service';
import { CustomerGroupQueryDTO, CustomerGroupSaveDTO } from './dto';

@ApiTags('Admin - Customer Groups')
@Controller('admin/customer-groups')
export class CustomerGroupsController {
  constructor(private readonly customerGroupsService: CustomerGroupsService) {}

  @Post('query')
  @RequireCapability(CAPABILITIES.CUSTOMER_GROUPS_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get paginated list of customer groups' })
  async getCustomerGroups(
    @Body() query: CustomerGroupQueryDTO,
    @AuthzCtx() authzCtx: AuthorizationContext
  ) {
    return this.customerGroupsService.getCustomerGroups(query, authzCtx);
  }

  @Post('save')
  @RequireCapability(CAPABILITIES.CUSTOMER_GROUPS_WRITE)
  @ApiOperation({ summary: 'Create or update a customer group' })
  async saveCustomerGroup(
    @Body() body: CustomerGroupSaveDTO,
    @AuthzCtx() authzCtx: AuthorizationContext
  ) {
    return this.customerGroupsService.saveCustomerGroup(body, authzCtx);
  }

  @Post(':id/evaluate')
  @RequireCapability(CAPABILITIES.CUSTOMER_GROUPS_WRITE)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Trigger manual evaluation of a customer group' })
  @ApiParam({ name: 'id', description: 'Customer Group ID' })
  async triggerEvaluation(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @AuthzCtx() authzCtx: AuthorizationContext
  ) {
    return this.customerGroupsService.triggerEvaluation(id, userId, authzCtx);
  }

  @Get(':id')
  @RequireCapability(CAPABILITIES.CUSTOMER_GROUPS_READ)
  @ApiOperation({ summary: 'Get customer group by ID' })
  @ApiParam({ name: 'id', description: 'Customer Group ID' })
  async getCustomerGroupById(
    @Param('id') id: string,
    @AuthzCtx() authzCtx: AuthorizationContext
  ) {
    return this.customerGroupsService.getCustomerGroupById(id, authzCtx);
  }

  @Delete(':id')
  @RequireCapability(CAPABILITIES.CUSTOMER_GROUPS_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a customer group' })
  @ApiParam({ name: 'id', description: 'Customer Group ID' })
  async deleteCustomerGroup(
    @Param('id') id: string,
    @AuthzCtx() authzCtx: AuthorizationContext
  ) {
    return this.customerGroupsService.deleteCustomerGroup(id, authzCtx);
  }
}
