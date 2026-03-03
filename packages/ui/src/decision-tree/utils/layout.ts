import dagre from '@dagrejs/dagre';
import type { Edge, Node } from '@xyflow/react';

const START_NODE_WIDTH = 240;
const CONDITION_NODE_WIDTH = 300;
const RESULT_NODE_WIDTH = 260;

const START_NODE_HEIGHT = 52;
const CONDITION_NODE_HEIGHT = 96;
const CONDITION_GROUP_NODE_HEIGHT = 116;
const RESULT_NODE_HEIGHT = 78;

function getNodeWidth(type: string | undefined): number {
  switch (type) {
    case 'start':
      return START_NODE_WIDTH;
    case 'result':
      return RESULT_NODE_WIDTH;
    default:
      return CONDITION_NODE_WIDTH;
  }
}

function getNodeHeight(type: string | undefined): number {
  switch (type) {
    case 'start':
      return START_NODE_HEIGHT;
    case 'conditionGroup':
      return CONDITION_GROUP_NODE_HEIGHT;
    case 'result':
      return RESULT_NODE_HEIGHT;
    default:
      return CONDITION_NODE_HEIGHT;
  }
}

export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[]
): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 100 });

  for (const node of nodes) {
    g.setNode(node.id, {
      width: getNodeWidth(node.type),
      height: getNodeHeight(node.type),
    });
  }

  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const pos = g.node(node.id);
    const width = getNodeWidth(node.type);
    const height = getNodeHeight(node.type);
    return {
      ...node,
      position: { x: pos.x - width / 2, y: pos.y - height / 2 },
    };
  });

  return { nodes: layoutedNodes, edges };
}
