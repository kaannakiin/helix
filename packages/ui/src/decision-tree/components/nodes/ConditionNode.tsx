'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Calendar, Hash, LetterText, List, ToggleLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { memo } from 'react';
import { useFieldLabels, useTreeMode, useTreeStore } from '../../context';
import type { ConditionFlowNodeData } from '../../types';

const filterTypeIcons: Record<string, typeof Hash> = {
  text: LetterText,
  number: Hash,
  date: Calendar,
  boolean: ToggleLeft,
  enum: List,
};

const filterTypeColors: Record<string, string> = {
  text: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  number:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  date: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  boolean:
    'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  enum: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
};

const handleStyle = { width: 12, height: 12 };

export const ConditionNode = memo(({ id, data }: NodeProps) => {
  const { condition } = data as ConditionFlowNodeData;
  const selectedNodeId = useTreeStore((s) => s.selectedNodeId);
  const t = useTranslations('frontend.decisionTree');
  const { fieldLabels, operatorLabels } = useFieldLabels();
  const mode = useTreeMode();
  const isSelected = selectedNodeId === id;

  const Icon = filterTypeIcons[condition.filterType] ?? Hash;
  const colorClass = filterTypeColors[condition.filterType] ?? '';
  const fieldLabel = fieldLabels[condition.field] ?? condition.field;
  const opLabel =
    operatorLabels[condition.op] ??
    t(`operators.${condition.op}` as never) ??
    condition.op;

  let valuePreview = '';
  if (condition.filterType === 'boolean') {
    valuePreview = condition.value ? 'True' : 'False';
  } else if (condition.filterType === 'enum') {
    valuePreview = Array.isArray(condition.value)
      ? condition.value.join(', ')
      : String(condition.value);
  } else {
    valuePreview = String(condition.value);
    if ('valueTo' in condition && condition.valueTo !== undefined) {
      valuePreview += ` — ${condition.valueTo}`;
    }
  }

  return (
    <div
      className="w-[300px] cursor-pointer rounded-xl border p-4 shadow-sm transition-shadow hover:shadow-md"
      style={{
        background: 'var(--mantine-color-body)',
        borderColor: isSelected
          ? 'var(--mantine-color-primary-filled)'
          : 'var(--mantine-color-default-border)',
        boxShadow: isSelected
          ? '0 0 0 3px var(--mantine-color-primary-light)'
          : undefined,
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{
          ...handleStyle,
          background: 'var(--mantine-color-dimmed)',
        }}
      />

      <div className="flex items-start gap-2.5">
        <div
          className={`flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium ${colorClass}`}
        >
          <Icon size={12} />
          {fieldLabel}
        </div>
      </div>

      <div
        className="mt-2 text-xs"
        style={{ color: 'var(--mantine-color-dimmed)' }}
      >
        {opLabel}
      </div>

      {valuePreview && (
        <div
          className="mt-1.5 truncate text-sm font-semibold"
          style={{ color: 'var(--mantine-color-text)' }}
        >
          {valuePreview}
        </div>
      )}

      {mode === 'simple' ? (
        <Handle
          type="source"
          position={Position.Bottom}
          id="next"
          style={{
            ...handleStyle,
            background: 'var(--mantine-color-primary-filled)',
          }}
        />
      ) : (
        <>
          <Handle
            type="source"
            position={Position.Bottom}
            id="yes"
            style={{ ...handleStyle, background: '#22c55e', left: '35%' }}
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id="no"
            style={{ ...handleStyle, background: '#ef4444', left: '65%' }}
          />
        </>
      )}
    </div>
  );
});

ConditionNode.displayName = 'ConditionNode';
