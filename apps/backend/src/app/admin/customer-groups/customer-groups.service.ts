import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { RuleTargetEntity, type Prisma } from '@org/prisma/client';
import {
  AdminCustomerGroupDetailPrismaQuery,
  AdminCustomerGroupListPrismaQuery,
  type AdminCustomerGroupDetailPrismaType,
  type AdminCustomerGroupListPrismaType,
} from '@org/types/admin/customer-groups';
import type { FilterCondition } from '@org/types/data-query';
import type { PaginatedResponse } from '@org/types/pagination';
import { buildPrismaQuery } from '../../../core/utils/prisma-query-builder';
import { PrismaService } from '../../prisma/prisma.service';
import { EvaluationService } from '../../evaluation/evaluation.service';
import type { CustomerGroupQueryDTO, CustomerGroupSaveDTO } from './dto';

@Injectable()
export class CustomerGroupsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly evaluationService: EvaluationService
  ) {}

  async getCustomerGroups(
    query: CustomerGroupQueryDTO
  ): Promise<PaginatedResponse<AdminCustomerGroupListPrismaType>> {
    const { page, limit, filters, sort } = query;

    const { where, orderBy, skip, take } = buildPrismaQuery({
      page,
      limit,
      filters: filters as Record<string, FilterCondition> | undefined,
      sort,
      defaultSort: { field: 'createdAt', order: 'desc' },
    });

    const [items, total] = await Promise.all([
      this.prisma.customerGroup.findMany({
        where: where as Prisma.CustomerGroupWhereInput,
        orderBy: orderBy as
          | Prisma.CustomerGroupOrderByWithRelationInput
          | Prisma.CustomerGroupOrderByWithRelationInput[],
        skip,
        take,
        include: AdminCustomerGroupListPrismaQuery,
      }),
      this.prisma.customerGroup.count({
        where: where as Prisma.CustomerGroupWhereInput,
      }),
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

  async *iterateCustomerGroups(opts: {
    where: Prisma.CustomerGroupWhereInput;
    orderBy:
      | Prisma.CustomerGroupOrderByWithRelationInput
      | Prisma.CustomerGroupOrderByWithRelationInput[];
    batchSize: number;
  }): AsyncGenerator<AdminCustomerGroupListPrismaType[]> {
    let cursor: string | undefined;

    while (true) {
      const batch = await this.prisma.customerGroup.findMany({
        where: opts.where,
        orderBy: opts.orderBy,
        take: opts.batchSize,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        include: AdminCustomerGroupListPrismaQuery,
      });

      if (batch.length === 0) break;

      yield batch;
      cursor = batch[batch.length - 1].id;

      if (batch.length < opts.batchSize) break;
    }
  }

  async getCustomerGroupById(
    id: string
  ): Promise<AdminCustomerGroupDetailPrismaType> {
    const group = await this.prisma.customerGroup.findUnique({
      where: { id },
      include: AdminCustomerGroupDetailPrismaQuery,
    });

    if (!group) {
      throw new NotFoundException('common.errors.customer_group_not_found');
    }

    return group;
  }

  async saveCustomerGroup(
    data: CustomerGroupSaveDTO
  ): Promise<AdminCustomerGroupDetailPrismaType> {
    const {
      id,
      name,
      description,
      color,
      type,
      isActive,
      ruleTreeId,
      ruleTree,
      cronExpression,
    } = data;

    const group = await this.prisma.$transaction(async (tx) => {
      let resolvedRuleTreeId: string | null = null;

      if (type === 'RULE_BASED') {
        if (ruleTree) {
          const ruleTreeData = {
            name: ruleTree.name,
            description: ruleTree.description ?? null,
            targetEntity: RuleTargetEntity.USER,
            conditions: (ruleTree.tree ?? null) as Prisma.InputJsonValue,
            isActive: ruleTree.isActive ?? true,
          };

          if (ruleTreeId) {
            const updated = await tx.ruleTree.update({
              where: { id: ruleTreeId },
              data: ruleTreeData,
            });
            resolvedRuleTreeId = updated.id;
          } else {
            const created = await tx.ruleTree.create({
              data: ruleTreeData,
            });
            resolvedRuleTreeId = created.id;
          }
        } else if (ruleTreeId) {
          resolvedRuleTreeId = ruleTreeId;
        }
      }

      return tx.customerGroup.upsert({
        where: { id },
        create: {
          id,
          name,
          description: description ?? null,
          color: color ?? null,
          type,
          isActive,
          ruleTreeId: resolvedRuleTreeId,
          cronExpression: cronExpression ?? null,
        },
        update: {
          name,
          description: description ?? null,
          color: color ?? null,
          type,
          isActive,
          ruleTreeId: resolvedRuleTreeId,
          cronExpression: cronExpression ?? null,
        },
        include: AdminCustomerGroupDetailPrismaQuery,
      });
    });

    await this.evaluationService.notifySchedulerRefresh(
      'customer-group-updated'
    );

    return group;
  }

  async triggerEvaluation(
    customerGroupId: string,
    triggeredBy: string
  ): Promise<{ jobId: string }> {
    const group = await this.prisma.customerGroup.findUnique({
      where: { id: customerGroupId },
      include: { ruleTree: { select: { id: true } } },
    });

    if (!group) {
      throw new NotFoundException('common.errors.customer_group_not_found');
    }

    if (group.type !== 'RULE_BASED') {
      throw new BadRequestException(
        'common.errors.evaluation_manual_group'
      );
    }

    if (!group.ruleTree) {
      throw new BadRequestException(
        'common.errors.evaluation_no_rule_tree'
      );
    }

    const { id: jobId } = await this.evaluationService.createAndEnqueue({
      entityId: group.id,
      entityType: 'CustomerGroup',
      targetEntity: 'USER',
      ruleTreeId: group.ruleTree.id,
      triggeredBy,
      triggerType: 'MANUAL',
    });

    return { jobId };
  }

  async deleteCustomerGroup(id: string): Promise<void> {
    const group = await this.prisma.customerGroup.findUnique({
      where: { id },
    });

    if (!group) {
      throw new NotFoundException('common.errors.customer_group_not_found');
    }

    await this.prisma.customerGroup.delete({ where: { id } });
  }
}
