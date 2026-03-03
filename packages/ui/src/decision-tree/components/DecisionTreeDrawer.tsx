'use client';

import { Button, Drawer, Group, Text, useDrawersStack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import type { DecisionTree } from '@org/types/rule-engine';
import { ReactFlowProvider } from '@xyflow/react';
import { Save, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef } from 'react';
import {
  ActionRegistryContext,
  DecisionTreeModeContext,
  DecisionTreeStoreContext,
  FieldLabelContext,
} from '../context';
import { createDecisionTreeStore } from '../hooks/useDecisionTreeStore';
import type { DecisionTreeDrawerProps } from '../types';
import { DecisionTreeCanvas } from './DecisionTreeCanvas';
import { ConditionEditDrawer } from './drawers/ConditionEditDrawer';
import { ConditionGroupEditDrawer } from './drawers/ConditionGroupEditDrawer';
import { ResultEditDrawer } from './drawers/ResultEditDrawer';

const VALIDATION_PREFIX = 'validation.';

function translateMessage(msg: string, tv: (key: string) => string): string {
  if (msg.startsWith(VALIDATION_PREFIX)) {
    try {
      return tv(msg.slice(VALIDATION_PREFIX.length));
    } catch {
      return msg;
    }
  }
  return msg;
}

export function DecisionTreeDrawer<TAction extends string = string>({
  opened,
  onClose,
  value,
  onChange,
  schema,
  fieldConfig,
  mode,
  actionRegistry,
  fieldLabels,
  operatorLabels,
}: DecisionTreeDrawerProps<TAction>) {
  const t = useTranslations('frontend.decisionTree');
  const tv = useTranslations('validation');
  const storeRef = useRef(createDecisionTreeStore());
  const stack = useDrawersStack(['condition', 'conditionGroup', 'result']);

  useEffect(() => {
    if (opened) {
      storeRef.current
        .getState()
        .initialize(value as DecisionTree | undefined, mode);

      if (mode === 'simple' && actionRegistry.length > 0) {
        const state = storeRef.current.getState();
        const hasResult = state.nodes.some(
          (n) => (n.data as Record<string, unknown>).nodeType === 'result'
        );
        if (!hasResult) {
          state.addResultNode(actionRegistry[0].action);
        }
      }

      stack.closeAll();
    }
  }, [opened, value, mode, actionRegistry]);

  const handleNodeClick = useCallback(
    (nodeId: string, nodeType: string) => {
      if (nodeType === 'start') return;
      if (
        nodeType === 'condition' ||
        nodeType === 'conditionGroup' ||
        nodeType === 'result'
      ) {
        stack.open(nodeType as 'condition' | 'conditionGroup' | 'result');
      }
    },
    [stack]
  );

  const handleSaveAndClose = useCallback(() => {
    const tree = storeRef.current.getState().toDecisionTree();
    const result = schema.safeParse(tree);

    if (!result.success) {
      const issues = result.error?.issues ?? [];
      const message = issues
        .slice(0, 3)
        .map(
          (i) =>
            `${i.path?.map(String).join('.') ?? ''}: ${translateMessage(
              i.message,
              (key) => tv(key)
            )}`
        )
        .join('\n');

      notifications.show({
        color: 'red',
        title: t('validationFailed'),
        message: message || t('validationErrorMessage'),
      });
      return;
    }

    onChange(result.data as DecisionTree<TAction>);
    onClose();
  }, [schema, t, tv, onChange, onClose]);

  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  const fieldLabelContextValue = {
    fieldLabels: fieldLabels ?? {},
    operatorLabels: operatorLabels ?? {},
  };

  return (
    <DecisionTreeStoreContext.Provider value={storeRef.current}>
      <DecisionTreeModeContext.Provider value={mode}>
        <ActionRegistryContext.Provider value={actionRegistry}>
          <FieldLabelContext.Provider value={fieldLabelContextValue}>
            <Drawer.Root
              opened={opened}
              onClose={handleCancel}
              size="100%"
              position="bottom"
              closeOnEscape={false}
              closeOnClickOutside={false}
            >
              <Drawer.Overlay />
              <Drawer.Content>
                <Drawer.Header>
                  <Drawer.Title>
                    <Text fw={600} size="lg">
                      {t('drawerTitle')}
                    </Text>
                  </Drawer.Title>
                  <Group gap="sm" ml="auto">
                    <Button
                      variant="default"
                      leftSection={<X size={16} />}
                      onClick={handleCancel}
                    >
                      {t('cancel')}
                    </Button>
                    <Button
                      leftSection={<Save size={16} />}
                      onClick={handleSaveAndClose}
                    >
                      {t('saveAndClose')}
                    </Button>
                  </Group>
                </Drawer.Header>

                <Drawer.Body
                  style={{ height: 'calc(100vh - 80px)', padding: 0 }}
                >
                  <div style={{ height: '100%' }}>
                    <ReactFlowProvider>
                      <DecisionTreeCanvas
                        fieldConfig={fieldConfig}
                        onNodeClick={handleNodeClick}
                      />
                    </ReactFlowProvider>
                  </div>

                  <Drawer.Stack>
                    <ConditionEditDrawer
                      {...stack.register('condition')}
                      position="right"
                      size="md"
                      fieldConfig={fieldConfig}
                    />
                    <ConditionGroupEditDrawer
                      {...stack.register('conditionGroup')}
                      position="right"
                      size="md"
                      fieldConfig={fieldConfig}
                    />
                    <ResultEditDrawer
                      {...stack.register('result')}
                      position="right"
                      size="md"
                    />
                  </Drawer.Stack>
                </Drawer.Body>
              </Drawer.Content>
            </Drawer.Root>
          </FieldLabelContext.Provider>
        </ActionRegistryContext.Provider>
      </DecisionTreeModeContext.Provider>
    </DecisionTreeStoreContext.Provider>
  );
}
