import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@org/prisma/client';
import type { EvaluationResult } from '@org/types/evaluation';
import type { MembershipDecisionTree } from '@org/types/rule-engine';
import { PrismaService } from '../../prisma/prisma.service';
import { DecisionTreeConverter } from '../converters/decision-tree-converter';
import { BaseEvaluator, type EvaluateContext } from './base-evaluator';

const CHUNK_SIZE = 1000;

@Injectable()
export class CustomerGroupEvaluator extends BaseEvaluator {
  readonly targetEntity = 'USER';
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

    const [totalUsers, matchedUsers] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.findMany({
        where: prismaWhere as Prisma.UserWhereInput,
        select: { id: true },
      }),
    ]);

    const matchedUserIds = new Set(matchedUsers.map((u) => u.id));

    await this.prisma.$transaction(async (tx) => {
      const currentMembers = await tx.customerGroupMember.findMany({
        where: { customerGroupId: ctx.entityId },
        select: { id: true, userId: true },
      });

      const currentMemberIds = new Set(currentMembers.map((m) => m.userId));

      const toAdd = [...matchedUserIds].filter(
        (id) => !currentMemberIds.has(id)
      );
      const toRemove = currentMembers
        .filter((m) => !matchedUserIds.has(m.userId))
        .map((m) => m.id);

      if (toRemove.length > 0) {
        await tx.customerGroupMember.deleteMany({
          where: { id: { in: toRemove } },
        });
      }

      for (let i = 0; i < toAdd.length; i += CHUNK_SIZE) {
        const chunk = toAdd.slice(i, i + CHUNK_SIZE);
        await tx.customerGroupMember.createMany({
          data: chunk.map((userId) => ({
            customerGroupId: ctx.entityId,
            userId,
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
      `Evaluated CustomerGroup ${ctx.entityId}: ${matchedUserIds.size}/${totalUsers} matched in ${durationMs}ms`
    );

    return {
      recordsEvaluated: totalUsers,
      recordsMatched: matchedUserIds.size,
      durationMs,
    };
  }
}
