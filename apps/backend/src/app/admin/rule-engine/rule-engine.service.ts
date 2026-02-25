import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@org/prisma/client';
import type {
  CreateCustomerGroupInput,
  CreateRuleTreeInput,
  EvaluatePreviewInput,
  ModifyMembersInput,
  UpdateCustomerGroupInput,
  UpdateRuleTreeInput,
} from '@org/schemas/rule-engine';
import type { PaginatedResponse } from '@org/types/pagination';
import type { RuleGroup } from '@org/types/rule-engine';
import { buildRuleTreePrismaWhere } from '../../../core/utils/rule-tree-evaluator';
import { PrismaService } from '../../prisma/prisma.service';
import { validateRuleTreeFields } from './rule-engine.validator';

@Injectable()
export class RuleEngineService {
  constructor(private readonly prisma: PrismaService) {}

  async createRuleTree(data: CreateRuleTreeInput) {
    validateRuleTreeFields(data.targetEntity, data.conditions as RuleGroup);

    return this.prisma.ruleTree.create({
      data: {
        name: data.name,
        description: data.description,
        targetEntity: data.targetEntity,
        conditions: data.conditions as unknown as Prisma.InputJsonValue,
        isActive: data.isActive,
      },
    });
  }

  async getRuleTreeById(id: string) {
    const tree = await this.prisma.ruleTree.findUnique({ where: { id } });
    if (!tree) throw new NotFoundException('Rule tree not found');
    return tree;
  }

  async listRuleTrees(targetEntity?: string) {
    return this.prisma.ruleTree.findMany({
      where: targetEntity
        ? { targetEntity: targetEntity as Prisma.EnumRuleTargetEntityFilter }
        : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateRuleTree(id: string, data: UpdateRuleTreeInput) {
    await this.getRuleTreeById(id);

    if (data.conditions && data.targetEntity) {
      validateRuleTreeFields(data.targetEntity, data.conditions as RuleGroup);
    }

    return this.prisma.ruleTree.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.targetEntity !== undefined && {
          targetEntity: data.targetEntity,
        }),
        ...(data.conditions !== undefined && {
          conditions: data.conditions as unknown as Prisma.InputJsonValue,
        }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  }

  async deleteRuleTree(id: string) {
    await this.getRuleTreeById(id);
    return this.prisma.ruleTree.delete({ where: { id } });
  }

  async evaluatePreview(data: EvaluatePreviewInput) {
    validateRuleTreeFields(data.targetEntity, data.conditions as RuleGroup);
    const where = buildRuleTreePrismaWhere(
      data.conditions as RuleGroup
    ) as Prisma.UserWhereInput;

    const count = await this.prisma.user.count({ where });
    return { where, matchCount: count };
  }

  async createCustomerGroup(data: CreateCustomerGroupInput) {
    if (data.type === 'RULE_BASED') {
      if (data.ruleTree) {
        validateRuleTreeFields('USER', data.ruleTree.conditions as RuleGroup);

        return this.prisma.customerGroup.create({
          data: {
            name: data.name,
            description: data.description,
            color: data.color,
            type: 'RULE_BASED',
            isActive: data.isActive,
            ruleTree: {
              create: {
                name: data.ruleTree.name,
                description: data.ruleTree.description,
                targetEntity: 'USER',
                conditions: data.ruleTree
                  .conditions as unknown as Prisma.InputJsonValue,
                isActive: data.ruleTree.isActive,
              },
            },
          },
          include: { ruleTree: true },
        });
      }

      if (!data.ruleTreeId) {
        throw new BadRequestException(
          'Either ruleTree or ruleTreeId must be provided for RULE_BASED groups'
        );
      }

      await this.getRuleTreeById(data.ruleTreeId);

      return this.prisma.customerGroup.create({
        data: {
          name: data.name,
          description: data.description,
          color: data.color,
          type: 'RULE_BASED',
          isActive: data.isActive,
          ruleTreeId: data.ruleTreeId,
        },
        include: { ruleTree: true },
      });
    }

    const group = await this.prisma.customerGroup.create({
      data: {
        name: data.name,
        description: data.description,
        color: data.color,
        type: 'MANUAL',
        isActive: data.isActive,
      },
      include: { _count: { select: { members: true } } },
    });

    if (data.memberIds && data.memberIds.length > 0) {
      await this.prisma.customerGroupMember.createMany({
        data: data.memberIds.map((userId) => ({
          customerGroupId: group.id,
          userId,
        })),
        skipDuplicates: true,
      });
    }

    return group;
  }

  async listCustomerGroups() {
    return this.prisma.customerGroup.findMany({
      include: {
        ruleTree: true,
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCustomerGroupById(id: string) {
    const group = await this.prisma.customerGroup.findUnique({
      where: { id },
      include: {
        ruleTree: true,
        _count: { select: { members: true } },
      },
    });
    if (!group) throw new NotFoundException('Customer group not found');
    return group;
  }

  async updateCustomerGroup(id: string, data: UpdateCustomerGroupInput) {
    await this.getCustomerGroupById(id);

    return this.prisma.customerGroup.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: {
        ruleTree: true,
        _count: { select: { members: true } },
      },
    });
  }

  async deleteCustomerGroup(id: string) {
    await this.getCustomerGroupById(id);
    return this.prisma.customerGroup.delete({ where: { id } });
  }

  async getCustomerGroupMembers(
    groupId: string,
    page: number,
    limit: number
  ): Promise<PaginatedResponse<unknown>> {
    const group = await this.getCustomerGroupById(groupId);

    if (group.type === 'RULE_BASED') {
      if (!group.ruleTree) {
        throw new BadRequestException(
          'Rule-based group has no associated rule tree'
        );
      }

      const conditions = group.ruleTree.conditions as unknown as RuleGroup;
      const where = buildRuleTreePrismaWhere(
        conditions
      ) as Prisma.UserWhereInput;

      const [items, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.user.count({ where }),
      ]);

      return {
        data: items,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }

    const [members, total] = await Promise.all([
      this.prisma.customerGroupMember.findMany({
        where: { customerGroupId: groupId },
        include: { user: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { addedAt: 'desc' },
      }),
      this.prisma.customerGroupMember.count({
        where: { customerGroupId: groupId },
      }),
    ]);

    return {
      data: members.map((m) => m.user),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async countCustomerGroupMembers(groupId: string): Promise<number> {
    const group = await this.getCustomerGroupById(groupId);

    if (group.type === 'RULE_BASED') {
      if (!group.ruleTree) return 0;

      const conditions = group.ruleTree.conditions as unknown as RuleGroup;
      const where = buildRuleTreePrismaWhere(
        conditions
      ) as Prisma.UserWhereInput;
      return this.prisma.user.count({ where });
    }

    return this.prisma.customerGroupMember.count({
      where: { customerGroupId: groupId },
    });
  }

  async addMembers(groupId: string, data: ModifyMembersInput) {
    const group = await this.getCustomerGroupById(groupId);
    if (group.type !== 'MANUAL') {
      throw new BadRequestException(
        'Can only add members to MANUAL customer groups'
      );
    }

    await this.prisma.customerGroupMember.createMany({
      data: data.userIds.map((userId) => ({
        customerGroupId: groupId,
        userId,
      })),
      skipDuplicates: true,
    });

    return this.getCustomerGroupById(groupId);
  }

  async removeMembers(groupId: string, data: ModifyMembersInput) {
    const group = await this.getCustomerGroupById(groupId);
    if (group.type !== 'MANUAL') {
      throw new BadRequestException(
        'Can only remove members from MANUAL customer groups'
      );
    }

    await this.prisma.customerGroupMember.deleteMany({
      where: {
        customerGroupId: groupId,
        userId: { in: data.userIds },
      },
    });

    return this.getCustomerGroupById(groupId);
  }
}
