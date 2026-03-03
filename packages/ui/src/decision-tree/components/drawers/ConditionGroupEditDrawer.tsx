'use client';

import {
  ActionIcon,
  Button,
  Divider,
  Drawer,
  Group,
  NumberInput,
  Paper,
  SegmentedControl,
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
import type {
  RuleCondition,
  RuleLogicalOperator,
} from '@org/types/rule-engine';
import { Plus, Save, Trash2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFieldLabels, useTreeStore } from '../../context';
import type { ConditionGroupFlowNodeData } from '../../types';
import {
  createDefaultCondition,
  getFilterOpsForType,
} from '../../utils/defaults';

interface Props extends DrawerProps {
  fieldConfig: Record<string, FieldFilterConfig>;
}

function ConditionForm({
  condition,
  index,
  fieldConfig,
  onChange,
  onRemove,
}: {
  condition: RuleCondition;
  index: number;
  fieldConfig: Record<string, FieldFilterConfig>;
  onChange: (index: number, condition: RuleCondition) => void;
  onRemove: (index: number) => void;
}) {
  const t = useTranslations('frontend.decisionTree');
  const { fieldLabels, operatorLabels } = useFieldLabels();

  const fieldOptions = Object.entries(fieldConfig).map(([key]) => ({
    value: key,
    label: fieldLabels[key] ?? key,
  }));

  const filterType = fieldConfig[condition.field]?.filterType;
  const operatorOptions = filterType
    ? getFilterOpsForType(filterType).map((op) => ({
        value: op,
        label:
          operatorLabels[op] ?? t(`operators.${op}` as never) ?? op,
      }))
    : [];

  const handleFieldChange = (field: string | null) => {
    if (!field) return;
    const config = fieldConfig[field];
    if (!config) return;
    onChange(index, createDefaultCondition(field, config));
  };

  return (
    <Paper withBorder p="sm" radius="sm">
      <Group justify="space-between" mb="xs">
        <Text size="xs" fw={600} c="dimmed">
          #{index + 1}
        </Text>
        <ActionIcon
          size="xs"
          variant="subtle"
          color="red"
          onClick={() => onRemove(index)}
        >
          <Trash2 size={12} />
        </ActionIcon>
      </Group>

      <Stack gap="xs">
        <Select
          size="xs"
          label={t('selectField')}
          data={fieldOptions}
          value={condition.field}
          onChange={handleFieldChange}
          searchable
        />

        {filterType !== 'boolean' && (
          <Select
            size="xs"
            label={t('selectOperator')}
            data={operatorOptions}
            value={condition.op}
            onChange={(op) => {
              if (!op) return;
              onChange(index, {
                ...condition,
                op: op as RuleCondition['op'],
              } as RuleCondition);
            }}
          />
        )}

        {filterType === 'text' && condition.filterType === 'text' && (
          <TextInput
            size="xs"
            label={t('enterValue')}
            value={condition.value}
            onChange={(e) =>
              onChange(index, { ...condition, value: e.currentTarget.value })
            }
          />
        )}

        {filterType === 'number' && condition.filterType === 'number' && (
          <>
            <NumberInput
              size="xs"
              label={t('enterValue')}
              value={condition.value}
              onChange={(val) =>
                onChange(index, { ...condition, value: Number(val) || 0 })
              }
            />
            {condition.op === 'between' && (
              <NumberInput
                size="xs"
                label={t('enterValueTo')}
                value={condition.valueTo ?? 0}
                onChange={(val) =>
                  onChange(index, {
                    ...condition,
                    valueTo: Number(val) || 0,
                  })
                }
              />
            )}
          </>
        )}

        {filterType === 'date' && condition.filterType === 'date' && (
          <>
            <DateInput
              size="xs"
              label={t('enterValue')}
              value={condition.value ? new Date(condition.value) : null}
              onChange={(date) =>
                onChange(index, {
                  ...condition,
                  value: date ? new Date(date).toISOString() : '',
                })
              }
            />
            {condition.op === 'between' && (
              <DateInput
                size="xs"
                label={t('enterValueTo')}
                value={condition.valueTo ? new Date(condition.valueTo) : null}
                onChange={(date) =>
                  onChange(index, {
                    ...condition,
                    valueTo: date ? new Date(date).toISOString() : '',
                  })
                }
              />
            )}
          </>
        )}

        {filterType === 'boolean' && condition.filterType === 'boolean' && (
          <Switch
            size="xs"
            label={t('enterValue')}
            checked={condition.value}
            onChange={(e) =>
              onChange(index, {
                ...condition,
                value: e.currentTarget.checked,
              })
            }
          />
        )}

        {filterType === 'enum' && condition.filterType === 'enum' && (
          <Select
            size="xs"
            label={t('enterValue')}
            data={
              fieldConfig[condition.field]?.values?.map((v) => ({
                value: v,
                label: v,
              })) ?? []
            }
            value={
              Array.isArray(condition.value)
                ? condition.value[0]
                : condition.value
            }
            onChange={(val) => {
              if (!val) return;
              onChange(index, {
                ...condition,
                value: condition.op === 'in' ? [val] : val,
              });
            }}
          />
        )}
      </Stack>
    </Paper>
  );
}

export const ConditionGroupEditDrawer = ({
  fieldConfig,
  ...drawerProps
}: Props) => {
  const t = useTranslations('frontend.decisionTree');
  const nodes = useTreeStore((s) => s.nodes);
  const selectedNodeId = useTreeStore((s) => s.selectedNodeId);
  const updateConditionGroupNode = useTreeStore(
    (s) => s.updateConditionGroupNode
  );

  const [operator, setOperator] = useState<RuleLogicalOperator>('AND');
  const [conditions, setConditions] = useState<RuleCondition[]>([]);
  const initialOperatorRef = useRef<RuleLogicalOperator>('AND');
  const initialConditionsRef = useRef<RuleCondition[]>([]);

  useEffect(() => {
    if (!selectedNodeId || !drawerProps.opened) {
      setOperator('AND');
      setConditions([]);
      initialOperatorRef.current = 'AND';
      initialConditionsRef.current = [];
      return;
    }
    const node = nodes.find((n) => n.id === selectedNodeId);
    if (node?.type === 'conditionGroup') {
      const data = node.data as ConditionGroupFlowNodeData;
      initialOperatorRef.current = data.operator;
      initialConditionsRef.current = data.conditions.map((c) => ({ ...c }));
      setOperator(data.operator);
      setConditions(data.conditions.map((c) => ({ ...c })));
    }
  }, [selectedNodeId, drawerProps.opened, nodes]);

  const isDirty =
    operator !== initialOperatorRef.current ||
    JSON.stringify(conditions) !== JSON.stringify(initialConditionsRef.current);

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

  const handleConditionChange = useCallback(
    (index: number, condition: RuleCondition) => {
      setConditions((prev) => {
        const next = [...prev];
        next[index] = condition;
        return next;
      });
    },
    []
  );

  const handleRemoveCondition = useCallback((index: number) => {
    setConditions((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleAddCondition = useCallback(() => {
    const firstField = Object.keys(fieldConfig)[0];
    if (!firstField) return;
    const config = fieldConfig[firstField];
    setConditions((prev) => [
      ...prev,
      createDefaultCondition(firstField, config),
    ]);
  }, [fieldConfig]);

  const handleSave = () => {
    if (!selectedNodeId) return;
    updateConditionGroupNode(selectedNodeId, operator, conditions);
    drawerProps.onClose();
  };

  return (
    <Drawer
      {...drawerProps}
      onClose={handleClose}
      title={
        <Text fw={600} size="md">
          {t('editConditionGroup')}
        </Text>
      }
    >
      <Stack gap="md">
        <div>
          <Text size="sm" fw={500} mb={4}>
            {t('selectOperator')}
          </Text>
          <SegmentedControl
            value={operator}
            onChange={(val) => setOperator(val as RuleLogicalOperator)}
            data={[
              { label: 'AND', value: 'AND' },
              { label: 'OR', value: 'OR' },
            ]}
            fullWidth
          />
        </div>

        <Divider />

        <Stack gap="sm">
          {conditions.map((condition, i) => (
            <ConditionForm
              key={i}
              condition={condition}
              index={i}
              fieldConfig={fieldConfig}
              onChange={handleConditionChange}
              onRemove={handleRemoveCondition}
            />
          ))}
        </Stack>

        <Button
          size="xs"
          variant="light"
          leftSection={<Plus size={14} />}
          onClick={handleAddCondition}
        >
          {t('addConditionToGroup')}
        </Button>

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
