'use client';

import { Button, Group, Popover, Stack, Text } from '@mantine/core';
import { Children, cloneElement, type ReactElement, type ReactNode, useState } from 'react';

interface ConfirmPopoverProps {
  children: ReactNode;
  label?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  confirmColor?: string;
  width?: number;
}

export function ConfirmPopover({
  children,
  label,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  confirmColor = 'red',
  width = 220,
}: ConfirmPopoverProps) {
  const [opened, setOpened] = useState(false);
  const [loading, setLoading] = useState(false);

  const child = Children.only(children) as ReactElement<{ onClick?: (e: React.MouseEvent) => void }>;
  const trigger = cloneElement(child, {
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
      child.props.onClick?.(e);
      setOpened((o) => !o);
    },
  });

  return (
    <Popover
      opened={opened}
      onChange={setOpened}
      width={width}
      position="bottom-end"
      withArrow
      shadow="sm"
      trapFocus
    >
      <Popover.Target>{trigger}</Popover.Target>
      <Popover.Dropdown>
        <Stack gap="sm">
          {label && (
            <Text size="sm">{label}</Text>
          )}
          <Group gap="xs" justify="flex-end">
            <Button
              variant="default"
              size="xs"
              disabled={loading}
              onClick={() => setOpened(false)}
            >
              {cancelLabel}
            </Button>
            <Button
              color={confirmColor}
              size="xs"
              loading={loading}
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                try {
                  await onConfirm();
                  setOpened(false);
                } finally {
                  setLoading(false);
                }
              }}
            >
              {confirmLabel}
            </Button>
          </Group>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}
