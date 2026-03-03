'use client';

import { useMantineColorScheme, useMantineTheme } from '@mantine/core';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Play } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { memo } from 'react';

export const StartNode = memo((_props: NodeProps) => {
  const t = useTranslations('common.decisionTree');
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';

  const primaryColor = theme.colors[theme.primaryColor]?.[6] ?? '#4f46e5';
  const primaryLight = isDark
    ? `${primaryColor}20`
    : theme.colors[theme.primaryColor]?.[0] ?? `${primaryColor}15`;

  return (
    <div
      className="flex w-[220px] cursor-default items-center justify-center gap-2.5 rounded-2xl border-2 px-5 py-3 shadow-md"
      style={{
        background: primaryLight,
        borderColor: primaryColor,
        color: primaryColor,
      }}
    >
      <Play size={15} fill="currentColor" />
      <span className="text-sm font-bold tracking-wide">
        {t('startNode')}
      </span>

      <Handle
        type="source"
        position={Position.Bottom}
        id="next"
        style={{
          width: 12,
          height: 12,
          background: primaryColor,
          border: 'none',
        }}
      />
    </div>
  );
});

StartNode.displayName = 'StartNode';
