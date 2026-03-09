import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@org/prisma/client';
import type { EvaluationResult } from '@org/types/evaluation';
import type { MembershipDecisionTree } from '@org/types/rule-engine';
import { PrismaService } from '../../../prisma/prisma.service';
import { DecisionTreeConverter } from '../converters/decision-tree-converter';
import { BaseEvaluator, type EvaluateContext } from './base-evaluator';

const CHUNK_SIZE = 1000;

@Injectable()
export class CustomerGroupEvaluator extends BaseEvaluator {
  readonly targetEntity = 'CUSTOMER';
  private readonly logger = new Logger(CustomerGroupEvaluator.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly treeConverter: DecisionTreeConverter
  ) {
    super();
  }

  async evaluate(ctx: EvaluateContext): Promise<EvaluationResult> {
    const startTime = Date.now();

    const group = await this.prisma.customerGroup.findUniqueOrThrow({
      where: { id: ctx.entityId },
      include: { ruleTree: true },
    });

    if (!group.ruleTree?.conditions) {
      throw new Error(`CustomerGroup ${ctx.entityId} has no rule tree`);
    }

    const tree = group.ruleTree.conditions as unknown as MembershipDecisionTree;
    const prismaWhere = this.treeConverter.convertToWhere(tree);

    const [totalCustomers, matchedCustomers] = await Promise.all([
      this.prisma.customer.count({ where: { storeId: group.storeId } }),
      this.prisma.customer.findMany({
        where: {
          storeId: group.storeId,
          ...(prismaWhere as Prisma.CustomerWhereInput),
        },
        select: { id: true },
      }),
    ]);

    const matchedCustomerIds = new Set(matchedCustomers.map((c) => c.id));

    await this.prisma.$transaction(async (tx) => {
      const currentMembers = await tx.customerGroupMember.findMany({
        where: { customerGroupId: ctx.entityId },
        select: { id: true, customerId: true },
      });

      const currentMemberIds = new Set(
        currentMembers.map((m) => m.customerId).filter(Boolean) as string[]
      );

      const toAdd = [...matchedCustomerIds].filter(
        (id) => !currentMemberIds.has(id)
      );
      const toRemove = currentMembers
        .filter((m) => !m.customerId || !matchedCustomerIds.has(m.customerId))
        .map((m) => m.id);

      if (toRemove.length > 0) {
        await tx.customerGroupMember.deleteMany({
          where: { id: { in: toRemove } },
        });
      }

      for (let i = 0; i < toAdd.length; i += CHUNK_SIZE) {
        const chunk = toAdd.slice(i, i + CHUNK_SIZE);
        await tx.customerGroupMember.createMany({
          data: chunk.map((customerId) => ({
            customerGroupId: ctx.entityId,
            customerId,
          })),
          skipDuplicates: true,
        });
      }

      await tx.customerGroup.update({
        where: { id: ctx.entityId },
        data: { lastEvaluatedAt: new Date() },
      });

      this.logger.log(
        `Membership sync: +${toAdd.length} added, -${toRemove.length} removed, ${currentMemberIds.size} existing`
      );
    });

    const durationMs = Date.now() - startTime;

    this.logger.log(
      `Evaluated CustomerGroup ${ctx.entityId}: ${matchedCustomerIds.size}/${totalCustomers} matched in ${durationMs}ms`
    );

    return {
      recordsEvaluated: totalCustomers,
      recordsMatched: matchedCustomerIds.size,
      durationMs,
    };
  }
}
