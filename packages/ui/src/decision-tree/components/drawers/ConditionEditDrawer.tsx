'use client';

import {
  Button,
  Drawer,
  Group,
  NumberInput,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
  type DrawerProps,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { DateInput } from '@mantine/dates';
import type { FieldFilterConfig } from '@org/types/data-query';
import type { RuleCondition } from '@org/types/rule-engine';
import { Save, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFieldLabels, useTreeStore } from '../../context';
import type { ConditionFlowNodeData } from '../../types';
import {
  createDefaultCondition,
  getFilterOpsForType,
} from '../../utils/defaults';

interface Props extends DrawerProps {
  fieldConfig: Record<string, FieldFilterConfig>;
}

export const ConditionEditDrawer = ({ fieldConfig, ...drawerProps }: Props) => {
  const t = useTranslations('common.decisionTree');
  const { fieldLabels, operatorLabels } = useFieldLabels();
  const nodes = useTreeStore((s) => s.nodes);
  const selectedNodeId = useTreeStore((s) => s.selectedNodeId);
  const updateConditionNode = useTreeStore((s) => s.updateConditionNode);

  const [draft, setDraft] = useState<RuleCondition | null>(null);
  const initialValueRef = useRef<RuleCondition | null>(null);

  useEffect(() => {
    if (!selectedNodeId || !drawerProps.opened) {
      setDraft(null);
      initialValueRef.current = null;
      return;
    }
    const node = nodes.find((n) => n.id === selectedNodeId);
    if (node?.type === 'condition') {
      const data = node.data as ConditionFlowNodeData;
      const initial = { ...data.condition };
      initialValueRef.current = initial;
      setDraft(initial);
    }
  }, [selectedNodeId, drawerProps.opened, nodes]);

  const isDirty =
    draft !== null &&
    JSON.stringify(draft) !== JSON.stringify(initialValueRef.current);

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

  const fieldOptions = Object.entries(fieldConfig).map(([key]) => ({
    value: key,
    label: fieldLabels[key] ?? key,
  }));

  const currentFilterType = draft
    ? fieldConfig[draft.field]?.filterType
    : undefined;

  const operatorOptions = currentFilterType
    ? getFilterOpsForType(currentFilterType).map((op) => ({
        value: op,
        label: operatorLabels[op] ?? t(`operators.${op}` as never) ?? op,
      }))
    : [];

  const handleFieldChange = useCallback(
    (field: string | null) => {
      if (!field) return;
      const config = fieldConfig[field];
      if (!config) return;
      setDraft(createDefaultCondition(field, config));
    },
    [fieldConfig]
  );

  const handleOperatorChange = useCallback(
    (op: string | null) => {
      if (!draft || !op) return;
      setDraft({ ...draft, op: op as RuleCondition['op'] } as RuleCondition);
    },
    [draft]
  );

  const handleSave = () => {
    if (!selectedNodeId || !draft) return;
    updateConditionNode(selectedNodeId, draft);
    drawerProps.onClose();
  };

  if (!draft) return <Drawer {...drawerProps} onClose={handleClose} />;

  return (
    <Drawer
      {...drawerProps}
      onClose={handleClose}
      title={
        <Text fw={600} size="md">
          {t('editCondition')}
        </Text>
      }
    >
      <Stack gap="md">
        <Select
          label={t('selectField')}
          data={fieldOptions}
          value={draft.field}
          onChange={handleFieldChange}
          searchable
        />

        {currentFilterType !== 'boolean' && (
          <Select
            label={t('selectOperator')}
            data={operatorOptions}
            value={draft.op}
            onChange={handleOperatorChange}
          />
        )}

        {currentFilterType === 'text' && draft.filterType === 'text' && (
          <TextInput
            label={t('enterValue')}
            value={draft.value}
            onChange={(e) =>
              setDraft({ ...draft, value: e.currentTarget.value })
            }
          />
        )}

        {currentFilterType === 'number' && draft.filterType === 'number' && (
          <>
            <NumberInput
              label={t('enterValue')}
              value={draft.value}
              onChange={(val) =>
                setDraft({ ...draft, value: Number(val) || 0 })
              }
            />
            {draft.op === 'between' && (
              <NumberInput
                label={t('enterValueTo')}
                value={draft.valueTo ?? 0}
                onChange={(val) =>
                  setDraft({ ...draft, valueTo: Number(val) || 0 })
                }
              />
            )}
          </>
        )}

        {currentFilterType === 'date' && draft.filterType === 'date' && (
          <>
            <DateInput
              label={t('enterValue')}
              value={draft.value ? new Date(draft.value) : null}
              onChange={(date) =>
                setDraft({
                  ...draft,
                  value: date ? new Date(date).toISOString() : '',
                })
              }
            />
            {draft.op === 'between' && (
              <DateInput
                label={t('enterValueTo')}
                value={draft.valueTo ? new Date(draft.valueTo) : null}
                onChange={(date) =>
                  setDraft({
                    ...draft,
                    valueTo: date ? new Date(date).toISOString() : '',
                  })
                }
              />
            )}
          </>
        )}

        {currentFilterType === 'boolean' && draft.filterType === 'boolean' && (
          <Switch
            label={t('enterValue')}
            checked={draft.value}
            onChange={(e) =>
              setDraft({ ...draft, value: e.currentTarget.checked })
            }
          />
        )}

        {currentFilterType === 'enum' && draft.filterType === 'enum' && (
          <Select
            label={t('enterValue')}
            data={
              fieldConfig[draft.field]?.values?.map((v) => ({
                value: v,
                label: v,
              })) ?? []
            }
            value={Array.isArray(draft.value) ? draft.value[0] : draft.value}
            onChange={(val) => {
              if (!val) return;
              setDraft({
                ...draft,
                value: draft.op === 'in' ? [val] : val,
              });
            }}
          />
        )}

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
