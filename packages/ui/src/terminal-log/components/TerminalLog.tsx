'use client';

import { Box, ScrollArea, Text } from '@mantine/core';
import { useEffect, useRef } from 'react';
import type { LogEntry, LogLevel } from '../types';
import { formatLogTimestamp } from '../utils/format';

const LEVEL_COLORS: Record<LogLevel, string> = {
  info: 'dimmed',
  success: 'teal',
  error: 'red',
  warn: 'yellow',
};

const LEVEL_LABELS: Record<LogLevel, string> = {
  info: 'INFO',
  success: 'SUCCESS',
  error: 'ERROR',
  warn: 'WARN',
};

export interface TerminalLogProps {
  entries: LogEntry[];
  height?: number | string;
  autoScroll?: boolean;
  emptyMessage?: string;
}

export function TerminalLog({
  entries,
  height = 250,
  autoScroll = true,
  emptyMessage = 'No logs yet.',
}: TerminalLogProps) {
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && viewportRef.current) {
      viewportRef.current.scrollTo({
        top: viewportRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [entries.length, autoScroll]);

  return (
    <Box
      style={{
        backgroundColor: '#1a1b2e',
        borderRadius: 'var(--mantine-radius-sm)',
        padding: 'var(--mantine-spacing-xs)',
      }}
    >
      <ScrollArea h={height} viewportRef={viewportRef}>
        {entries.length === 0 ? (
          <Text size="xs" c="dimmed" ff="monospace" p="xs">
            {emptyMessage}
          </Text>
        ) : (
          entries.map((entry, i) => (
            <Box key={i} style={{ display: 'flex', gap: 6, padding: '1px 0' }}>
              <Text
                span
                size="xs"
                ff="monospace"
                c="dimmed"
                style={{ flexShrink: 0 }}
              >
                {formatLogTimestamp(entry.timestamp)}
              </Text>
              <Text
                span
                size="xs"
                ff="monospace"
                fw={600}
                c={LEVEL_COLORS[entry.level]}
                style={{ flexShrink: 0 }}
              >
                [{LEVEL_LABELS[entry.level]}]
              </Text>
              <Text span size="xs" ff="monospace" c="gray.3">
                {entry.message}
              </Text>
            </Box>
          ))
        )}
      </ScrollArea>
    </Box>
  );
}
