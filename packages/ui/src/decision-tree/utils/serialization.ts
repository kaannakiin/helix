import type {
  DecisionTree,
  DecisionTreeConditionGroupNode,
  DecisionTreeConditionNode,
  DecisionTreeNode,
} from '@org/types/rule-engine';
import type { Edge, Node } from '@xyflow/react';
import type {
  ConditionFlowNodeData,
  ConditionGroupFlowNodeData,
  DecisionTreeMode,
  ResultFlowNodeData,
  StartFlowNodeData,
} from '../types';
import { getLayoutedElements } from './layout';

export const START_NODE_ID = '__start__';

// ─── Tree → Flow ────────────────────────────────────────────────────────────

function treeNodeToFlowNode(treeNode: DecisionTreeNode): Node {
  const base = { id: treeNode.id, position: { x: 0, y: 0 } };

  switch (treeNode.type) {
    case 'condition':
      return {
        ...base,
        type: 'condition',
        data: {
          nodeType: 'condition',
          condition: treeNode.condition,
        } satisfies ConditionFlowNodeData,
      };
    case 'conditionGroup':
      return {
        ...base,
        type: 'conditionGroup',
        data: {
          nodeType: 'conditionGroup',
          operator: treeNode.operator,
          conditions: treeNode.conditions,
        } satisfies ConditionGroupFlowNodeData,
      };
    case 'result':
      return {
        ...base,
        type: 'result',
        data: {
          nodeType: 'result',
          action: treeNode.action,
          label: treeNode.label,
        } satisfies ResultFlowNodeData,
      };
  }
}

function createStartNode(): Node {
  return {
    id: START_NODE_ID,
    type: 'start',
    position: { x: 0, y: 0 },
    data: { nodeType: 'start' } satisfies StartFlowNodeData,
    deletable: false,
    draggable: false,
  };
}

function createBranchEdges(
  node: DecisionTreeConditionNode | DecisionTreeConditionGroupNode,
  mode: DecisionTreeMode
): Edge[] {
  const edges: Edge[] = [];

  if (mode === 'simple') {
    // Simple mode: yesBranch maps to 'next' handle
    if (node.yesBranch) {
      edges.push({
        id: `e-${node.id}-next-${node.yesBranch}`,
        source: node.id,
        target: node.yesBranch,
        sourceHandle: 'next',
        type: 'smoothstep',
        animated: true,
      });
    }
  } else {
    // Advanced mode: yes/no handles
    if (node.yesBranch) {
      edges.push({
        id: `e-${node.id}-yes-${node.yesBranch}`,
        source: node.id,
        target: node.yesBranch,
        sourceHandle: 'yes',
        type: 'smoothstep',
        animated: true,
      });
    }

    if (node.noBranch) {
      edges.push({
        id: `e-${node.id}-no-${node.noBranch}`,
        source: node.id,
        target: node.noBranch,
        sourceHandle: 'no',
        type: 'smoothstep',
        animated: true,
      });
    }
  }

  return edges;
}

export function treeToFlow(
  tree: DecisionTree | undefined,
  mode: DecisionTreeMode
): { nodes: Node[]; edges: Edge[] } {
  const startNode = createStartNode();

  if (!tree || !tree.nodes.length) {
    return { nodes: [startNode], edges: [] };
  }

  const nodes: Node[] = [startNode, ...tree.nodes.map(treeNodeToFlowNode)];
  const edges: Edge[] = [];

  // Edge from start node to root
  edges.push({
    id: `e-${START_NODE_ID}-next-${tree.rootNodeId}`,
    source: START_NODE_ID,
    target: tree.rootNodeId,
    sourceHandle: 'next',
    type: 'smoothstep',
    animated: true,
  });

  for (const treeNode of tree.nodes) {
    if (treeNode.type === 'condition' || treeNode.type === 'conditionGroup') {
      edges.push(...createBranchEdges(treeNode, mode));
    }
  }

  return getLayoutedElements(nodes, edges);
}

// ─── Flow → Tree ────────────────────────────────────────────────────────────

export function flowToTree(nodes: Node[], edges: Edge[]): DecisionTree {
  // Filter out start node
  const dataNodes = nodes.filter((n) => n.id !== START_NODE_ID);

  if (dataNodes.length === 0) {
    return { rootNodeId: '', nodes: [] };
  }

  // Build edge maps: 'next' handle is treated as yesBranch
  const yesEdges = new Map<string, string>();
  const noEdges = new Map<string, string>();

  for (const edge of edges) {
    if (edge.source === START_NODE_ID) continue; // skip start→root edge
    if (edge.sourceHandle === 'yes' || edge.sourceHandle === 'next') {
      yesEdges.set(edge.source, edge.target);
    } else if (edge.sourceHandle === 'no') {
      noEdges.set(edge.source, edge.target);
    }
  }

  // Root node: the node that the start node connects to
  const startEdge = edges.find((e) => e.source === START_NODE_ID);
  let rootNodeId = startEdge?.target ?? '';

  // Fallback: find node with no incoming edges from data nodes
  if (!rootNodeId) {
    const targetIds = new Set(
      edges
        .filter((e) => e.source !== START_NODE_ID)
        .map((e) => e.target)
    );
    const rootNode = dataNodes.find((n) => !targetIds.has(n.id));
    rootNodeId = rootNode?.id ?? dataNodes[0].id;
  }

  const treeNodes: DecisionTreeNode[] = dataNodes.map((node) => {
    const data = node.data as Record<string, unknown>;
    const nodeType = data.nodeType as string;

    switch (nodeType) {
      case 'condition': {
        const d = data as ConditionFlowNodeData;
        return {
          id: node.id,
          type: 'condition' as const,
          condition: d.condition,
          yesBranch: yesEdges.get(node.id) ?? null,
          noBranch: noEdges.get(node.id) ?? null,
        };
      }
      case 'conditionGroup': {
        const d = data as ConditionGroupFlowNodeData;
        return {
          id: node.id,
          type: 'conditionGroup' as const,
          operator: d.operator,
          conditions: d.conditions,
          yesBranch: yesEdges.get(node.id) ?? null,
          noBranch: noEdges.get(node.id) ?? null,
        };
      }
      case 'result': {
        const d = data as ResultFlowNodeData;
        return {
          id: node.id,
          type: 'result' as const,
          action: d.action,
          label: d.label,
        };
      }
      default:
        return {
          id: node.id,
          type: 'result' as const,
          action: '',
          label: '',
        };
    }
  });

  return { rootNodeId, nodes: treeNodes };
}
