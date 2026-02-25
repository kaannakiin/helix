import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { UserRole } from '@org/prisma/client';
import type { CreateCustomerGroupInput } from '@org/schemas/rule-engine';
import { Roles } from '../../../core/decorators';
import {
  CreateManualCustomerGroupDTO,
  CreateRuleBasedCustomerGroupDTO,
  CreateRuleTreeDTO,
  EvaluatePreviewDTO,
  ModifyMembersDTO,
  UpdateCustomerGroupDTO,
  UpdateRuleTreeDTO,
} from './dto';
import { RuleEngineService } from './rule-engine.service';

@ApiTags('Admin - Rule Engine')
@Controller('admin/rule-engine')
@Roles(UserRole.ADMIN)
@ApiExtraModels(CreateRuleBasedCustomerGroupDTO, CreateManualCustomerGroupDTO)
export class RuleEngineController {
  constructor(private readonly ruleEngineService: RuleEngineService) {}

  @Post('trees')
  @ApiOperation({ summary: 'Create a new rule tree' })
  async createRuleTree(@Body() body: CreateRuleTreeDTO) {
    return this.ruleEngineService.createRuleTree(body);
  }

  @Get('trees')
  @ApiOperation({ summary: 'List all rule trees' })
  @ApiQuery({ name: 'targetEntity', required: false })
  async listRuleTrees(@Query('targetEntity') targetEntity?: string) {
    return this.ruleEngineService.listRuleTrees(targetEntity);
  }

  @Get('trees/:id')
  @ApiOperation({ summary: 'Get a rule tree by ID' })
  @ApiParam({ name: 'id' })
  async getRuleTree(@Param('id') id: string) {
    return this.ruleEngineService.getRuleTreeById(id);
  }

  @Put('trees/:id')
  @ApiOperation({ summary: 'Update a rule tree' })
  @ApiParam({ name: 'id' })
  async updateRuleTree(
    @Param('id') id: string,
    @Body() body: UpdateRuleTreeDTO
  ) {
    return this.ruleEngineService.updateRuleTree(id, body);
  }

  @Delete('trees/:id')
  @ApiOperation({ summary: 'Delete a rule tree' })
  @ApiParam({ name: 'id' })
  async deleteRuleTree(@Param('id') id: string) {
    return this.ruleEngineService.deleteRuleTree(id);
  }

  @Post('evaluate')
  @ApiOperation({ summary: 'Preview rule tree evaluation without saving' })
  async evaluatePreview(
    @Body() body: EvaluatePreviewDTO
  ): Promise<{ where: Record<string, unknown>; matchCount: number }> {
    return this.ruleEngineService.evaluatePreview(body);
  }

  @Post('customer-groups')
  @ApiOperation({ summary: 'Create a customer group (RULE_BASED or MANUAL)' })
  @ApiBody({
    schema: {
      oneOf: [
        { $ref: getSchemaPath(CreateRuleBasedCustomerGroupDTO) },
        { $ref: getSchemaPath(CreateManualCustomerGroupDTO) },
      ],
      discriminator: {
        propertyName: 'type',
        mapping: {
          RULE_BASED: getSchemaPath(CreateRuleBasedCustomerGroupDTO),
          MANUAL: getSchemaPath(CreateManualCustomerGroupDTO),
        },
      },
    },
  })
  async createCustomerGroup(
    @Body() body: CreateRuleBasedCustomerGroupDTO | CreateManualCustomerGroupDTO
  ) {
    return this.ruleEngineService.createCustomerGroup(
      body as CreateCustomerGroupInput
    );
  }

  @Get('customer-groups')
  @ApiOperation({ summary: 'List all customer groups' })
  async listCustomerGroups() {
    return this.ruleEngineService.listCustomerGroups();
  }

  @Get('customer-groups/:id')
  @ApiOperation({ summary: 'Get a customer group by ID' })
  @ApiParam({ name: 'id' })
  async getCustomerGroup(@Param('id') id: string) {
    return this.ruleEngineService.getCustomerGroupById(id);
  }

  @Put('customer-groups/:id')
  @ApiOperation({ summary: 'Update a customer group' })
  @ApiParam({ name: 'id' })
  async updateCustomerGroup(
    @Param('id') id: string,
    @Body() body: UpdateCustomerGroupDTO
  ) {
    return this.ruleEngineService.updateCustomerGroup(id, body);
  }

  @Delete('customer-groups/:id')
  @ApiOperation({ summary: 'Delete a customer group' })
  @ApiParam({ name: 'id' })
  async deleteCustomerGroup(@Param('id') id: string) {
    return this.ruleEngineService.deleteCustomerGroup(id);
  }

  @Get('customer-groups/:id/members')
  @ApiOperation({ summary: 'Get paginated members of a customer group' })
  @ApiParam({ name: 'id' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getCustomerGroupMembers(
    @Param('id') id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20
  ) {
    return this.ruleEngineService.getCustomerGroupMembers(id, +page, +limit);
  }

  @Get('customer-groups/:id/count')
  @ApiOperation({ summary: 'Count members of a customer group' })
  @ApiParam({ name: 'id' })
  async countCustomerGroupMembers(@Param('id') id: string) {
    const count = await this.ruleEngineService.countCustomerGroupMembers(id);
    return { count };
  }

  @Post('customer-groups/:id/members')
  @ApiOperation({ summary: 'Add members to a MANUAL customer group' })
  @ApiParam({ name: 'id' })
  async addMembers(@Param('id') id: string, @Body() body: ModifyMembersDTO) {
    return this.ruleEngineService.addMembers(id, body);
  }

  @Delete('customer-groups/:id/members')
  @ApiOperation({ summary: 'Remove members from a MANUAL customer group' })
  @ApiParam({ name: 'id' })
  async removeMembers(@Param('id') id: string, @Body() body: ModifyMembersDTO) {
    return this.ruleEngineService.removeMembers(id, body);
  }
}
