import type { FieldFilterConfig } from '@org/types/data-query';
import type {
  DecisionTree,
  RuleCondition,
  RuleLogicalOperator,
} from '@org/types/rule-engine';
import type {
  Connection,
  Edge,
  Node,
  OnEdgesChange,
  OnNodesChange,
} from '@xyflow/react';
import type { ComponentType } from 'react';
import type { ZodType } from 'zod';

export interface StartFlowNodeData extends Record<string, unknown> {
  nodeType: 'start';
}

export interface ConditionFlowNodeData extends Record<string, unknown> {
  nodeType: 'condition';
  condition: RuleCondition;
}

export interface ConditionGroupFlowNodeData extends Record<string, unknown> {
  nodeType: 'conditionGroup';
  operator: RuleLogicalOperator;
  conditions: RuleCondition[];
}

export interface ResultFlowNodeData<TAction extends string = string>
  extends Record<string, unknown> {
  nodeType: 'result';
  action: TAction;
  label?: string;
}

export type FlowNodeData<TAction extends string = string> =
  | StartFlowNodeData
  | ConditionFlowNodeData
  | ConditionGroupFlowNodeData
  | ResultFlowNodeData<TAction>;

export type DecisionTreeMode = 'simple' | 'advanced';

export interface ActionRegistryEntry<TAction extends string = string> {
  action: TAction;
  icon?: ComponentType<{ size?: number }>;
  color?: string;
  description?: string;
  formFields?: ComponentType<{
    value: Record<string, unknown>;
    onChange: (value: Record<string, unknown>) => void;
  }>;
}

export type ActionRegistry<TAction extends string = string> =
  ActionRegistryEntry<TAction>[];

export interface DecisionTreeDrawerProps<TAction extends string = string> {
  opened: boolean;
  onClose: () => void;
  value: DecisionTree<TAction> | undefined;
  onChange: (tree: DecisionTree<TAction>) => void;
  schema: ZodType;
  fieldConfig: Record<string, FieldFilterConfig>;
  mode: DecisionTreeMode;
  actionRegistry: ActionRegistry<TAction>;
  fieldLabels?: Record<string, string>;
  operatorLabels?: Record<string, string>;
}

export interface DecisionTreeStoreState {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  selectedNodeType: 'start' | 'condition' | 'conditionGroup' | 'result' | null;
  mode: DecisionTreeMode;

  initialize: (tree: DecisionTree | undefined, mode: DecisionTreeMode) => void;

  addConditionNode: (condition: RuleCondition) => void;
  addConditionGroupNode: (
    operator: RuleLogicalOperator,
    conditions: RuleCondition[]
  ) => void;
  addResultNode: (action: string, label?: string) => void;
  updateConditionNode: (nodeId: string, condition: RuleCondition) => void;
  updateConditionGroupNode: (
    nodeId: string,
    operator: RuleLogicalOperator,
    conditions: RuleCondition[]
  ) => void;
  updateResultNode: (nodeId: string, action: string, label?: string) => void;
  removeNode: (nodeId: string) => void;

  selectNode: (nodeId: string | null) => void;

  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: (connection: Connection) => void;
  isValidConnection: (connection: Connection | Edge) => boolean;

  toDecisionTree: () => DecisionTree;
}
