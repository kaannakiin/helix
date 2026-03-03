'use client';

import {
  Button,
  Drawer,
  Group,
  Select,
  Stack,
  Text,
  TextInput,
  type DrawerProps,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { Save, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useActionRegistry, useTreeMode, useTreeStore } from '../../context';
import type { ResultFlowNodeData } from '../../types';

export const ResultEditDrawer = ({ ...drawerProps }: DrawerProps) => {
  const t = useTranslations('frontend.decisionTree');
  const mode = useTreeMode();
  const registry = useActionRegistry();
  const nodes = useTreeStore((s) => s.nodes);
  const selectedNodeId = useTreeStore((s) => s.selectedNodeId);
  const updateResultNode = useTreeStore((s) => s.updateResultNode);

  const [action, setAction] = useState<string>(registry[0]?.action ?? '');
  const [label, setLabel] = useState('');
  const initialActionRef = useRef<string>('');
  const initialLabelRef = useRef<string>('');

  useEffect(() => {
    if (!selectedNodeId || !drawerProps.opened) {
      setAction(registry[0]?.action ?? '');
      setLabel('');
      initialActionRef.current = '';
      initialLabelRef.current = '';
      return;
    }
    const node = nodes.find((n) => n.id === selectedNodeId);
    if (node?.type === 'result') {
      const data = node.data as ResultFlowNodeData;
      initialActionRef.current = data.action;
      initialLabelRef.current = data.label ?? '';
      setAction(data.action);
      setLabel(data.label ?? '');
    }
  }, [selectedNodeId, drawerProps.opened, nodes, registry]);

  const isDirty =
    action !== initialActionRef.current || label !== initialLabelRef.current;

  const handleClose = useCallback(() => {
    if (isDirty) {
      modals.openConfirmModal({
        title: t('unsavedChangesTitle'),
        children: <Text size="sm">{t('unsavedChangesConfirm')}</Text>,
        labels: { confirm: t('discard'), cancel: t('cancel') },
        confirmProps: { color: 'red' },
        zIndex: 1000,
        onConfirm: () => drawerProps.onClose(),
      });
      return;
    }
    drawerProps.onClose();
  }, [isDirty, t, drawerProps]);

  const handleSave = () => {
    if (!selectedNodeId) return;
    updateResultNode(selectedNodeId, action, label);
    drawerProps.onClose();
  };

  const actionOptions = registry.map((entry) => ({
    value: entry.action,
    label: t(`actions.${entry.action}` as never) ?? entry.action,
  }));

  const ActiveFormFields = registry.find((e) => e.action === action)?.formFields;

  return (
    <Drawer
      {...drawerProps}
      onClose={handleClose}
      title={
        <Text fw={600} size="md">
          {t('editResult')}
        </Text>
      }
    >
      <Stack gap="md">
        {mode !== 'simple' && (
          <Select
            label={t('selectAction')}
            data={actionOptions}
            value={action}
            onChange={(val) => val && setAction(val)}
          />
        )}

        <TextInput
          label={t('labelPlaceholder')}
          value={label}
          onChange={(e) => setLabel(e.currentTarget.value)}
        />

        {ActiveFormFields && <ActiveFormFields value={{}} onChange={() => {}} />}

        <Group justify="flex-end" mt="md">
          <Button
            variant="default"
            size="sm"
            leftSection={<X size={14} />}
            onClick={handleClose}
          >
            {t('cancel')}
          </Button>
          <Button
            size="sm"
            leftSection={<Save size={14} />}
            onClick={handleSave}
          >
            {t('save')}
          </Button>
        </Group>
      </Stack>
    </Drawer>
  );
};
