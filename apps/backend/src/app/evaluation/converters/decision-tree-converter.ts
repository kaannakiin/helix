import { Injectable } from '@nestjs/common';
import type {
  DecisionTree,
  DecisionTreeConditionGroupNode,
  DecisionTreeConditionNode,
  DecisionTreeNode,
  MembershipAction,
} from '@org/types/rule-engine';
import {
  isConditionGroupNode,
  isConditionNode,
  isResultNode,
} from '@org/types/rule-engine';
import { ruleConditionToPrisma } from './condition-converter';

interface PathCondition {
  conditions: Record<string, unknown>[];
}

@Injectable()
export class DecisionTreeConverter {
  convertToWhere(
    tree: DecisionTree<MembershipAction>
  ): Record<string, unknown> {
    const nodeMap = new Map<string, DecisionTreeNode<MembershipAction>>();
    for (const node of tree.nodes) {
      nodeMap.set(node.id, node);
    }

    const rootNode = nodeMap.get(tree.rootNodeId);
    if (!rootNode) {
      throw new Error(`Root node ${tree.rootNodeId} not found in tree`);
    }

    const includePaths: PathCondition[] = [];
    this.walkTree(rootNode, nodeMap, [], includePaths);

    if (includePaths.length === 0) {
      return { id: { equals: '__NEVER_MATCH__' } };
    }

    if (includePaths.length === 1) {
      const path = includePaths[0];
      if (path.conditions.length === 0) return {};
      if (path.conditions.length === 1) return path.conditions[0];
      return { AND: path.conditions };
    }

    return {
      OR: includePaths.map((path) => {
        if (path.conditions.length === 0) return {};
        if (path.conditions.length === 1) return path.conditions[0];
        return { AND: path.conditions };
      }),
    };
  }

  private walkTree(
    node: DecisionTreeNode<MembershipAction>,
    nodeMap: Map<string, DecisionTreeNode<MembershipAction>>,
    currentConditions: Record<string, unknown>[],
    includePaths: PathCondition[]
  ): void {
    if (isResultNode(node)) {
      if (node.action === 'include') {
        includePaths.push({ conditions: [...currentConditions] });
      }
      return;
    }

    if (isConditionNode(node) || isConditionGroupNode(node)) {
      const positiveCondition = this.nodeToPositiveCondition(
        node as DecisionTreeConditionNode | DecisionTreeConditionGroupNode
      );
      const negativeCondition: Record<string, unknown> = {
        NOT: positiveCondition,
      };

      const branchNode = node as
        | DecisionTreeConditionNode
        | DecisionTreeConditionGroupNode;

      if (branchNode.yesBranch) {
        const yesNode = nodeMap.get(branchNode.yesBranch);
        if (yesNode) {
          this.walkTree(
            yesNode,
            nodeMap,
            [...currentConditions, positiveCondition],
            includePaths
          );
        }
      }

      if (branchNode.noBranch) {
        const noNode = nodeMap.get(branchNode.noBranch);
        if (noNode) {
          this.walkTree(
            noNode,
            nodeMap,
            [...currentConditions, negativeCondition],
            includePaths
          );
        }
      }
    }
  }

  private nodeToPositiveCondition(
    node: DecisionTreeConditionNode | DecisionTreeConditionGroupNode
  ): Record<string, unknown> {
    if (isConditionNode(node)) {
      return ruleConditionToPrisma(node.condition);
    }

    const groupNode = node as DecisionTreeConditionGroupNode;
    const prismaConditions = groupNode.conditions.map((c) =>
      ruleConditionToPrisma(c)
    );

    if (prismaConditions.length === 1) return prismaConditions[0];

    return { [groupNode.operator]: prismaConditions };
  }
}
