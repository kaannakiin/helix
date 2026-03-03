import type { DecisionTree } from '@org/types/rule-engine';
import { createId } from '@paralleldrive/cuid2';
import {
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from '@xyflow/react';
import { immer } from 'zustand/middleware/immer';
import { createStore } from 'zustand/vanilla';
import type {
  ConditionFlowNodeData,
  ConditionGroupFlowNodeData,
  DecisionTreeMode,
  DecisionTreeStoreState,
  ResultFlowNodeData,
} from '../types';
import { getLayoutedElements } from '../utils/layout';
import { flowToTree, START_NODE_ID, treeToFlow } from '../utils/serialization';

/**
 * Find the last node in the simple-mode linear chain.
 * Traverses start → next → next → ... until a node with no outgoing 'next' edge.
 */
function findLastChainNodeId(nodes: Node[], edges: Edge[]): string {
  let currentId = START_NODE_ID;
  const visited = new Set<string>();

  while (true) {
    visited.add(currentId);
    const nextEdge = edges.find(
      (e) =>
        e.source === currentId &&
        (e.sourceHandle === 'next' || e.sourceHandle === 'yes')
    );
    if (!nextEdge || visited.has(nextEdge.target)) break;
    currentId = nextEdge.target;
  }

  return currentId;
}

/**
 * Insert a new node at the end of the simple-mode chain.
 * If the last node is a result node, insert BEFORE it.
 */
function insertNodeInChain(
  nodes: Node[],
  edges: Edge[],
  newNode: Node
): { nodes: Node[]; edges: Edge[] } {
  const lastNodeId = findLastChainNodeId(nodes, edges);
  const lastNode = nodes.find((n) => n.id === lastNodeId);

  if (
    lastNode &&
    (lastNode.data as Record<string, unknown>).nodeType === 'result'
  ) {
    const edgeToResult = edges.find((e) => e.target === lastNodeId);

    if (edgeToResult) {
      const filteredEdges = edges.filter((e) => e.id !== edgeToResult.id);
      filteredEdges.push(
        {
          id: `e-${edgeToResult.source}-next-${newNode.id}`,
          source: edgeToResult.source,
          target: newNode.id,
          sourceHandle: 'next',
          type: 'smoothstep',
          animated: true,
        },
        {
          id: `e-${newNode.id}-next-${lastNodeId}`,
          source: newNode.id,
          target: lastNodeId,
          sourceHandle: 'next',
          type: 'smoothstep',
          animated: true,
        }
      );
      return { nodes: [...nodes, newNode], edges: filteredEdges };
    }
  }

  const newEdge: Edge = {
    id: `e-${lastNodeId}-next-${newNode.id}`,
    source: lastNodeId,
    target: newNode.id,
    sourceHandle: 'next',
    type: 'smoothstep',
    animated: true,
  };

  return { nodes: [...nodes, newNode], edges: [...edges, newEdge] };
}

export function createDecisionTreeStore(): import('zustand').StoreApi<DecisionTreeStoreState> {
  return createStore<DecisionTreeStoreState>()(
    immer((set, get) => ({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      selectedNodeType: null,
      mode: 'advanced' as DecisionTreeMode,

      initialize: (tree: DecisionTree | undefined, mode: DecisionTreeMode) => {
        const { nodes, edges } = treeToFlow(tree, mode);
        set((s) => {
          s.nodes = nodes;
          s.edges = edges;
          s.selectedNodeId = null;
          s.selectedNodeType = null;
          s.mode = mode;
        });
      },

      addConditionNode: (condition) => {
        const nodeId = createId();
        set((s) => {
          const newNode: Node = {
            id: nodeId,
            type: 'condition',
            position: { x: 0, y: 0 },
            data: {
              nodeType: 'condition',
              condition,
            } satisfies ConditionFlowNodeData,
          };

          if (s.mode === 'simple') {
            const result = insertNodeInChain(s.nodes, s.edges, newNode);
            const laid = getLayoutedElements(result.nodes, result.edges);
            s.nodes = laid.nodes;
            s.edges = laid.edges;
          } else {
            s.nodes.push(newNode);
            const laid = getLayoutedElements(s.nodes, s.edges);
            s.nodes = laid.nodes;
            s.edges = laid.edges;
          }

          s.selectedNodeId = nodeId;
          s.selectedNodeType = 'condition';
        });
      },

      addConditionGroupNode: (operator, conditions) => {
        const nodeId = createId();
        set((s) => {
          const newNode: Node = {
            id: nodeId,
            type: 'conditionGroup',
            position: { x: 0, y: 0 },
            data: {
              nodeType: 'conditionGroup',
              operator,
              conditions,
            } satisfies ConditionGroupFlowNodeData,
          };

          if (s.mode === 'simple') {
            const result = insertNodeInChain(s.nodes, s.edges, newNode);
            const laid = getLayoutedElements(result.nodes, result.edges);
            s.nodes = laid.nodes;
            s.edges = laid.edges;
          } else {
            s.nodes.push(newNode);
            const laid = getLayoutedElements(s.nodes, s.edges);
            s.nodes = laid.nodes;
            s.edges = laid.edges;
          }

          s.selectedNodeId = nodeId;
          s.selectedNodeType = 'conditionGroup';
        });
      },

      addResultNode: (action, label) => {
        const nodeId = createId();
        set((s) => {
          if (s.mode === 'simple') {
            const hasResult = s.nodes.some(
              (n) => (n.data as Record<string, unknown>).nodeType === 'result'
            );
            if (hasResult) return;
          }

          const newNode: Node = {
            id: nodeId,
            type: 'result',
            position: { x: 0, y: 0 },
            data: {
              nodeType: 'result',
              action,
              label: label ?? '',
            } satisfies ResultFlowNodeData,
          };

          if (s.mode === 'simple') {
            const result = insertNodeInChain(s.nodes, s.edges, newNode);
            const laid = getLayoutedElements(result.nodes, result.edges);
            s.nodes = laid.nodes;
            s.edges = laid.edges;
          } else {
            s.nodes.push(newNode);
            const laid = getLayoutedElements(s.nodes, s.edges);
            s.nodes = laid.nodes;
            s.edges = laid.edges;
          }

          s.selectedNodeId = nodeId;
          s.selectedNodeType = 'result';
        });
      },

      updateConditionNode: (nodeId, condition) => {
        set((s) => {
          const node = s.nodes.find((n) => n.id === nodeId);
          if (node) {
            node.data = {
              nodeType: 'condition',
              condition,
            } satisfies ConditionFlowNodeData;
          }
        });
      },

      updateConditionGroupNode: (nodeId, operator, conditions) => {
        set((s) => {
          const node = s.nodes.find((n) => n.id === nodeId);
          if (node) {
            node.data = {
              nodeType: 'conditionGroup',
              operator,
              conditions,
            } satisfies ConditionGroupFlowNodeData;
          }
        });
      },

      updateResultNode: (nodeId, action, label) => {
        set((s) => {
          const node = s.nodes.find((n) => n.id === nodeId);
          if (node) {
            node.data = {
              nodeType: 'result',
              action,
              label: label ?? '',
            } satisfies ResultFlowNodeData;
          }
        });
      },

      removeNode: (nodeId) => {
        if (nodeId === START_NODE_ID) return;

        set((s) => {
          if (s.mode === 'simple') {
            const incomingEdge = s.edges.find((e) => e.target === nodeId);
            const outgoingEdge = s.edges.find(
              (e) =>
                e.source === nodeId &&
                (e.sourceHandle === 'next' || e.sourceHandle === 'yes')
            );

            s.nodes = s.nodes.filter((n) => n.id !== nodeId);
            s.edges = s.edges.filter(
              (e) => e.source !== nodeId && e.target !== nodeId
            );

            if (incomingEdge && outgoingEdge) {
              s.edges.push({
                id: `e-${incomingEdge.source}-next-${outgoingEdge.target}`,
                source: incomingEdge.source,
                target: outgoingEdge.target,
                sourceHandle: 'next',
                type: 'smoothstep',
                animated: true,
              });
            }
          } else {
            s.nodes = s.nodes.filter((n) => n.id !== nodeId);
            s.edges = s.edges.filter(
              (e) => e.source !== nodeId && e.target !== nodeId
            );
          }

          if (s.selectedNodeId === nodeId) {
            s.selectedNodeId = null;
            s.selectedNodeType = null;
          }

          const laid = getLayoutedElements(s.nodes, s.edges);
          s.nodes = laid.nodes;
          s.edges = laid.edges;
        });
      },

      selectNode: (nodeId) => {
        set((s) => {
          s.selectedNodeId = nodeId;
          if (!nodeId) {
            s.selectedNodeType = null;
            return;
          }
          const node = s.nodes.find((n) => n.id === nodeId);
          if (node) {
            const data = node.data as Record<string, unknown>;
            s.selectedNodeType =
              (data.nodeType as DecisionTreeStoreState['selectedNodeType']) ??
              null;
          }
        });
      },

      onNodesChange: (changes: NodeChange[]) => {
        set((s) => {
          s.nodes = applyNodeChanges(changes, s.nodes) as Node[];
        });
      },

      onEdgesChange: (changes: EdgeChange[]) => {
        set((s) => {
          const filtered =
            s.mode === 'simple'
              ? changes.filter((c) => c.type !== 'remove')
              : changes;
          s.edges = applyEdgeChanges(filtered, s.edges) as Edge[];
        });
      },

      onConnect: (connection: Connection) => {
        set((s) => {
          if (s.mode === 'simple' && connection.sourceHandle !== 'next') {
            return;
          }

          const existingIdx = s.edges.findIndex(
            (e) =>
              e.source === connection.source &&
              e.sourceHandle === connection.sourceHandle
          );
          if (existingIdx !== -1) {
            s.edges.splice(existingIdx, 1);
          }

          s.edges.push({
            id: `e-${connection.source}-${connection.sourceHandle}-${connection.target}`,
            source: connection.source,
            target: connection.target,
            sourceHandle: connection.sourceHandle,
            targetHandle: connection.targetHandle,
            type: 'smoothstep',
            animated: true,
          });
        });
      },

      isValidConnection: (connection: Connection | Edge) => {
        const { mode, edges } = get();
        if (mode === 'simple') {
          if (edges.some((e) => e.target === connection.target)) return false;

          const visited = new Set<string>();
          const stack = [connection.target];
          while (stack.length > 0) {
            const current = stack.pop()!;
            if (current === connection.source) return false;
            if (visited.has(current)) continue;
            visited.add(current);
            edges
              .filter((e) => e.source === current)
              .forEach((e) => stack.push(e.target));
          }
          return true;
        }
        return true;
      },

      toDecisionTree: () => {
        const { nodes, edges } = get();
        return flowToTree(nodes, edges);
      },
    }))
  );
}
