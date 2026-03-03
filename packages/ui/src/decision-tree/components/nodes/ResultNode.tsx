'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Flag } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { memo } from 'react';
import { useActionRegistry, useTreeMode, useTreeStore } from '../../context';
import type { ResultFlowNodeData } from '../../types';

const colorMap: Record<string, { badgeCls: string; selectedColor: string }> = {
  emerald: {
    badgeCls:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    selectedColor: '#10b981',
  },
  teal: {
    badgeCls:
      'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
    selectedColor: '#14b8a6',
  },
  red: {
    badgeCls: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    selectedColor: '#ef4444',
  },
  violet: {
    badgeCls:
      'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    selectedColor: '#8b5cf6',
  },
  blue: {
    badgeCls:
      'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    selectedColor: '#3b82f6',
  },
};

const handleStyle = { width: 12, height: 12 };

export const ResultNode = memo(({ id, data }: NodeProps) => {
  const { action, label } = data as ResultFlowNodeData;
  const selectedNodeId = useTreeStore((s) => s.selectedNodeId);
  const mode = useTreeMode();
  const t = useTranslations('common.decisionTree');
  const registry = useActionRegistry();
  const isSelected = selectedNodeId === id;

  const entry = registry.find((e) => e.action === action);
  const Icon = entry?.icon ?? Flag;
  const color = entry?.color ?? 'emerald';
  const colors = colorMap[color] ?? colorMap.emerald!;

  const actionLabel = t(`actions.${action}` as never) ?? action;

  return (
    <div
      className={`w-[260px] rounded-xl border p-4 shadow-sm transition-shadow hover:shadow-md ${mode === 'simple' ? 'cursor-default' : 'cursor-pointer'}`}
      style={{
        background: 'var(--mantine-color-body)',
        borderColor: isSelected
          ? colors.selectedColor
          : 'var(--mantine-color-default-border)',
        boxShadow: isSelected
          ? `0 0 0 3px ${colors.selectedColor}33`
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

      <div className="flex items-center gap-2">
        <div
          className={`flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium ${colors.badgeCls}`}
        >
          <Icon size={12} />
          {t('resultNode')}
        </div>
      </div>

      <div
        className="mt-2 text-sm font-semibold"
        style={{ color: 'var(--mantine-color-text)' }}
      >
        {actionLabel}
      </div>

      {label && (
        <div
          className="mt-0.5 truncate text-xs"
          style={{ color: 'var(--mantine-color-dimmed)' }}
        >
          {label}
        </div>
      )}
    </div>
  );
});

ResultNode.displayName = 'ResultNode';
