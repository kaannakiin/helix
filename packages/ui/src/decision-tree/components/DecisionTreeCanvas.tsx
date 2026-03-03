'use client';

import { ActionIcon, Button, Group, Menu, Paper, Tooltip } from '@mantine/core';
import type { FieldFilterConfig } from '@org/types/data-query';
import {
  Background,
  Controls,
  MarkerType,
  Panel,
  ReactFlow,
  useReactFlow,
  type NodeTypes,
} from '@xyflow/react';
import { Flag, Layers, Maximize2, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo } from 'react';
import {
  useActionRegistry,
  useFieldLabels,
  useTreeMode,
  useTreeStore,
} from '../context';
import type { ActionRegistry, DecisionTreeMode } from '../types';
import { createDefaultCondition } from '../utils/defaults';
import { START_NODE_ID } from '../utils/serialization';
import { ConditionGroupNode } from './nodes/ConditionGroupNode';
import { ConditionNode } from './nodes/ConditionNode';
import { ResultNode } from './nodes/ResultNode';
import { StartNode } from './nodes/StartNode';

const nodeTypes: NodeTypes = {
  start: StartNode,
  condition: ConditionNode,
  conditionGroup: ConditionGroupNode,
  result: ResultNode,
};

interface Props {
  fieldConfig: Record<string, FieldFilterConfig>;
  onNodeClick: (nodeId: string, nodeType: string) => void;
}

export const DecisionTreeCanvas = ({ fieldConfig, onNodeClick }: Props) => {
  const t = useTranslations('common.decisionTree');
  const mode = useTreeMode();
  const registry = useActionRegistry();
  const { fieldLabels } = useFieldLabels();

  const nodes = useTreeStore((s) => s.nodes);
  const edges = useTreeStore((s) => s.edges);
  const selectedNodeId = useTreeStore((s) => s.selectedNodeId);
  const selectedNodeType = useTreeStore((s) => s.selectedNodeType);
  const onNodesChange = useTreeStore((s) => s.onNodesChange);
  const onEdgesChange = useTreeStore((s) => s.onEdgesChange);
  const onConnect = useTreeStore((s) => s.onConnect);
  const selectNode = useTreeStore((s) => s.selectNode);
  const addConditionNode = useTreeStore((s) => s.addConditionNode);
  const addConditionGroupNode = useTreeStore((s) => s.addConditionGroupNode);
  const addResultNode = useTreeStore((s) => s.addResultNode);
  const removeNode = useTreeStore((s) => s.removeNode);
  const isValidConnection = useTreeStore((s) => s.isValidConnection);

  const { fitView } = useReactFlow();

  const styledEdges = useMemo(() => {
    if (mode === 'simple') {
      return edges.map((e) => ({
        ...e,
        type: 'smoothstep' as const,
        animated: false,
        markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
        style: { stroke: '#94a3b8', strokeWidth: 2.5 },
      }));
    }
    return edges.map((e) => {
      const isYes = e.sourceHandle === 'yes';
      const isNo = e.sourceHandle === 'no';
      const color = isYes ? '#22c55e' : isNo ? '#ef4444' : '#94a3b8';
      return {
        ...e,
        type: 'smoothstep' as const,
        animated: false,
        label: isYes ? t('yesBranch') : isNo ? t('noBranch') : undefined,
        markerEnd: { type: MarkerType.ArrowClosed, color },
        style: { stroke: color, strokeWidth: 2.5 },
      };
    });
  }, [edges, mode, t]);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: { id: string; type?: string }) => {
      if (node.id === START_NODE_ID || node.type === 'start') return;
      selectNode(node.id);
      if (node.type) {
        onNodeClick(node.id, node.type);
      }
    },
    [selectNode, onNodeClick]
  );

  const handlePaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  const handleAddCondition = useCallback(
    (field: string) => {
      const config = fieldConfig[field];
      if (!config) return;
      const condition = createDefaultCondition(field, config);
      addConditionNode(condition);
      setTimeout(() => fitView({ duration: 300 }), 50);
    },
    [fieldConfig, addConditionNode, fitView]
  );

  const handleAddGroup = useCallback(() => {
    addConditionGroupNode('AND', []);
    setTimeout(() => fitView({ duration: 300 }), 50);
  }, [addConditionGroupNode, fitView]);

  const handleAddResult = useCallback(
    (action: string) => {
      addResultNode(action);
      setTimeout(() => fitView({ duration: 300 }), 50);
    },
    [addResultNode, fitView]
  );

  const handleRemove = useCallback(() => {
    if (selectedNodeId) {
      removeNode(selectedNodeId);
      setTimeout(() => fitView({ duration: 300 }), 50);
    }
  }, [selectedNodeId, removeNode, fitView]);

  const fieldOptions = useMemo(
    () =>
      Object.entries(fieldConfig).map(([key]) => ({
        value: key,
        label: fieldLabels[key] ?? key,
      })),
    [fieldConfig, fieldLabels]
  );

  const hasResultNode = useMemo(
    () => mode === 'simple' && nodes.some((n) => n.type === 'result'),
    [mode, nodes]
  );

  const canDelete =
    !!selectedNodeId &&
    selectedNodeId !== START_NODE_ID &&
    selectedNodeType !== 'start' &&
    !(mode === 'simple' && selectedNodeType === 'result');

  return (
    <div className="relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={styledEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        proOptions={{ hideAttribution: true }}
        deleteKeyCode={null}
        minZoom={0.2}
        maxZoom={1.5}
      >
        <Background gap={16} size={1} />
        <Controls showInteractive={false} />

        <Panel position="top-center">
          <Paper shadow="xs" p="xs" radius="md" withBorder>
            <Group gap="xs">
              <Menu shadow="md" width={220} position="bottom-start">
                <Menu.Target>
                  <Button
                    size="xs"
                    variant="light"
                    leftSection={<Plus size={14} />}
                  >
                    {t('addCondition')}
                  </Button>
                </Menu.Target>
                <Menu.Dropdown>
                  {fieldOptions.map((opt) => (
                    <Menu.Item
                      key={opt.value}
                      onClick={() => handleAddCondition(opt.value)}
                    >
                      {opt.label}
                    </Menu.Item>
                  ))}
                </Menu.Dropdown>
              </Menu>

              <Button
                size="xs"
                variant="light"
                color="violet"
                leftSection={<Layers size={14} />}
                onClick={handleAddGroup}
              >
                {t('addConditionGroup')}
              </Button>

              {renderAddResultButton(
                registry,
                t,
                handleAddResult,
                hasResultNode,
                mode
              )}

              <Tooltip label={t('deleteSelected')} position="bottom">
                <ActionIcon
                  size="sm"
                  variant="light"
                  color="red"
                  disabled={!canDelete}
                  onClick={handleRemove}
                >
                  <Trash2 size={14} />
                </ActionIcon>
              </Tooltip>

              <Tooltip label={t('fitView')} position="bottom">
                <ActionIcon
                  size="sm"
                  variant="light"
                  onClick={() => fitView({ duration: 300 })}
                >
                  <Maximize2 size={14} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Paper>
        </Panel>
      </ReactFlow>
    </div>
  );
};

function renderAddResultButton(
  registry: ActionRegistry,
  t: ReturnType<typeof useTranslations<'common.decisionTree'>>,
  onAdd: (action: string) => void,
  disabled: boolean,
  mode: DecisionTreeMode
) {
  if (mode === 'simple' || registry.length === 1) {
    const entry = registry[0];
    const Icon = entry.icon ?? Flag;
    return (
      <Button
        size="xs"
        variant="light"
        color={entry.color ?? 'teal'}
        leftSection={<Icon size={14} />}
        onClick={() => onAdd(entry.action)}
        disabled={disabled}
      >
        {t('addResult')}
      </Button>
    );
  }

  return (
    <Menu shadow="md" width={180} position="bottom-start">
      <Menu.Target>
        <Button
          size="xs"
          variant="light"
          color="teal"
          leftSection={<Flag size={14} />}
          disabled={disabled}
        >
          {t('addResult')}
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        {registry.map((entry) => {
          const Icon = entry.icon ?? Flag;
          return (
            <Menu.Item
              key={entry.action}
              leftSection={<Icon size={14} />}
              onClick={() => onAdd(entry.action)}
            >
              {t(`actions.${entry.action}` as never) ?? entry.action}
            </Menu.Item>
          );
        })}
      </Menu.Dropdown>
    </Menu>
  );
}
