'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Layers } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { memo } from 'react';
import { useFieldLabels, useTreeMode, useTreeStore } from '../../context';
import type { ConditionGroupFlowNodeData } from '../../types';

const handleStyle = { width: 12, height: 12 };

export const ConditionGroupNode = memo(({ id, data }: NodeProps) => {
  const { operator, conditions } = data as ConditionGroupFlowNodeData;
  const selectedNodeId = useTreeStore((s) => s.selectedNodeId);
  const t = useTranslations('common.decisionTree');
  const { fieldLabels, operatorLabels } = useFieldLabels();
  const mode = useTreeMode();
  const isSelected = selectedNodeId === id;

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

      <div className="flex items-center gap-2">
        <div className="flex shrink-0 items-center gap-1 rounded bg-violet-100 px-1.5 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
          <Layers size={12} />
          {t('conditionGroupNode')}
        </div>
        <span
          className="rounded px-1.5 py-0.5 text-xs font-semibold"
          style={{
            background: 'var(--mantine-color-default-hover)',
            color: 'var(--mantine-color-text)',
          }}
        >
          {operator}
        </span>
      </div>

      <div
        className="mt-2 text-xs"
        style={{ color: 'var(--mantine-color-dimmed)' }}
      >
        {t('conditionCount', { count: conditions.length })}
      </div>

      {conditions.length > 0 && (
        <div className="mt-1.5 space-y-0.5">
          {conditions.slice(0, 3).map((c, i) => (
            <div
              key={i}
              className="truncate text-xs"
              style={{ color: 'var(--mantine-color-dimmed)' }}
            >
              {fieldLabels[c.field] ?? c.field}{' '}
              {operatorLabels[c.op] ??
                t(`operators.${c.op}` as never) ??
                c.op}
            </div>
          ))}
          {conditions.length > 3 && (
            <div
              className="text-xs"
              style={{ color: 'var(--mantine-color-placeholder)' }}
            >
              {t('moreConditions', { count: conditions.length - 3 })}
            </div>
          )}
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

ConditionGroupNode.displayName = 'ConditionGroupNode';
