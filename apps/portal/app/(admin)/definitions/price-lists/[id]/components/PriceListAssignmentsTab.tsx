'use client';

import {
  useAdminPriceListAssignments,
  useCreatePriceListAssignment,
  useDeletePriceListAssignment,
  useUpdatePriceListAssignment,
} from '@/core/hooks/useAdminPriceListAssignments';
import {
  ActionIcon,
  Badge,
  Button,
  Group,
  NumberInput,
  Skeleton,
  Stack,
  Table,
  Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import type { PriceListAssignment } from '@org/prisma/browser';
import { AssignmentTargetTypeConfigs } from '@org/constants/enum-configs';
import type { PriceListAssignmentCreateInput, PriceListAssignmentCreateOutput } from '@org/schemas/admin/pricing';
import { FormCard } from '@org/ui/common/form-card';
import { Target, Trash, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { AddAssignmentModal } from './AddAssignmentModal';

interface PriceListAssignmentsTabProps {
  priceListId: string;
  storeId: string | null;
}

function getTargetName(
  assignment: PriceListAssignment & {
    customerGroup: { id: string; name: string } | null;
    organization: { id: string; name: string } | null;
    customer: {
      id: string;
      name: string;
      surname: string;
      email: string | null;
    } | null;
  },
  allCustomersLabel: string
): string {
  switch (assignment.targetType) {
    case 'ALL_CUSTOMERS':
      return allCustomersLabel;
    case 'CUSTOMER_GROUP':
      return assignment.customerGroup?.name ?? '—';
    case 'ORGANIZATION':
      return assignment.organization?.name ?? '—';
    case 'CUSTOMER': {
      const c = assignment.customer;
      return c ? `${c.name} ${c.surname}` : '—';
    }
    default:
      return '—';
  }
}

export function PriceListAssignmentsTab({
  priceListId,
  storeId,
}: PriceListAssignmentsTabProps) {
  const t = useTranslations('frontend.admin.priceLists.form.assignments');
  const tEnums = useTranslations('frontend.enums');
  const tForm = useTranslations('frontend.admin.priceLists.form');

  const { data: assignments, isLoading } =
    useAdminPriceListAssignments(priceListId);
  const updateAssignment = useUpdatePriceListAssignment(priceListId);
  const deleteAssignment = useDeletePriceListAssignment(priceListId);
  const createAssignment = useCreatePriceListAssignment(priceListId);

  const [addOpened, { open: openAdd, close: closeAdd }] = useDisclosure(false);
  const [priorityValues, setPriorityValues] = useState<Record<string, number>>({});
  const [pendingAssignments, setPendingAssignments] = useState<Array<PriceListAssignmentCreateInput & { _label?: string }>>([]);
  const [isSavingAll, setIsSavingAll] = useState(false);

  const handlePriorityBlur = (row: PriceListAssignment) => {
    const val = priorityValues[row.id];
    if (val === undefined || val === row.priority) return;
    updateAssignment.mutate(
      { id: row.id, data: { priority: val } },
      {
        onError: () =>
          notifications.show({ color: 'red', message: t('saveError') }),
      }
    );
  };

  const handleDelete = (row: PriceListAssignment) => {
    modals.openConfirmModal({
      title: t('deleteConfirmTitle'),
      children: <Text size="sm">{t('deleteConfirmBody')}</Text>,
      labels: { confirm: t('deleteConfirmTitle'), cancel: tForm('discard') },
      confirmProps: { color: 'red' },
      onConfirm: () =>
        deleteAssignment.mutate(row.id, {
          onSuccess: () =>
            notifications.show({
              color: 'green',
              message: t('deleteSuccess'),
            }),
          onError: () =>
            notifications.show({ color: 'red', message: t('deleteError') }),
        }),
    });
  };

  const isSameTarget = (
    a: { targetType: string; customerGroupId?: string | null; organizationId?: string | null; customerId?: string | null },
    b: PriceListAssignmentCreateInput
  ) => {
    if (a.targetType !== b.targetType) return false;
    switch (b.targetType) {
      case 'ALL_CUSTOMERS': return true;
      case 'CUSTOMER_GROUP': return a.customerGroupId === b.customerGroupId;
      case 'ORGANIZATION': return a.organizationId === b.organizationId;
      case 'CUSTOMER': return a.customerId === b.customerId;
      default: return false;
    }
  };

  const handleAddPending = (data: PriceListAssignmentCreateInput, label: string) => {
    const isDuplicate =
      (assignments ?? []).some((a) => isSameTarget(a, data)) ||
      pendingAssignments.some((a) => isSameTarget(a, data));

    if (isDuplicate) {
      notifications.show({ color: 'orange', message: t('duplicateError') });
      return;
    }
    setPendingAssignments((prev) => [...prev, { ...data, _label: label }]);
  };

  const handleRemovePending = (index: number) => {
    setPendingAssignments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveAll = async () => {
    setIsSavingAll(true);
    try {
      for (const { _label: _, ...item } of pendingAssignments) {
        await createAssignment.mutateAsync(item as PriceListAssignmentCreateOutput);
      }
      setPendingAssignments([]);
      notifications.show({ color: 'green', message: t('saveAllSuccess') });
    } catch {
      notifications.show({ color: 'red', message: t('saveError') });
    } finally {
      setIsSavingAll(false);
    }
  };

  return (
    <Stack gap="md">
      <FormCard
        title={t('title')}
        description={t('description')}
        icon={Target}
        iconColor="teal"
        rightSection={
          <Group gap="xs">
            {pendingAssignments.length > 0 && (
              <Button size="xs" loading={isSavingAll} onClick={handleSaveAll}>
                {t('saveAssignments', { count: pendingAssignments.length })}
              </Button>
            )}
            <Button size="xs" variant="default" onClick={openAdd}>
              {t('addAssignment')}
            </Button>
          </Group>
        }
      >
        {isLoading ? (
          <Stack gap="xs">
            <Skeleton height={36} />
            <Skeleton height={36} />
          </Stack>
        ) : (
          <Table horizontalSpacing="sm" verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('colTargetType')}</Table.Th>
                <Table.Th>{t('colTargetName')}</Table.Th>
                <Table.Th>{t('colPriority')}</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(assignments ?? []).map((row) => {
                const config =
                  AssignmentTargetTypeConfigs[
                    row.targetType as keyof typeof AssignmentTargetTypeConfigs
                  ];
                const priorityVal =
                  priorityValues[row.id] !== undefined
                    ? priorityValues[row.id]
                    : row.priority;
                return (
                  <Table.Tr key={row.id}>
                    <Table.Td>
                      <Badge variant="light" color={config?.color ?? 'gray'}>
                        {config
                          ? tEnums(config.labelKey)
                          : row.targetType}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      {getTargetName(row, t('allCustomersLabel'))}
                    </Table.Td>
                    <Table.Td>
                      <NumberInput
                        value={priorityVal}
                        min={0}
                        w={80}
                        onChange={(v) =>
                          setPriorityValues((prev) => ({
                            ...prev,
                            [row.id]: Number(v),
                          }))
                        }
                        onBlur={() => handlePriorityBlur(row)}
                      />
                    </Table.Td>
                    <Table.Td>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={() => handleDelete(row)}
                      >
                        <Trash size={16} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
              {pendingAssignments.map((pending, index) => {
                const config =
                  AssignmentTargetTypeConfigs[
                    pending.targetType as keyof typeof AssignmentTargetTypeConfigs
                  ];
                return (
                  <Table.Tr key={`pending-${index}`} style={{ opacity: 0.65 }}>
                    <Table.Td>
                      <Badge variant="dot" color="yellow">
                        {config
                          ? tEnums(config.labelKey)
                          : pending.targetType}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">{pending._label ?? t('unsavedLabel')}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{pending.priority}</Text>
                    </Table.Td>
                    <Table.Td>
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        onClick={() => handleRemovePending(index)}
                      >
                        <X size={16} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
              {(assignments ?? []).length === 0 && pendingAssignments.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={4}>
                    <Text size="sm" c="dimmed" ta="center">
                      {t('emptyState')}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        )}
      </FormCard>

      <AddAssignmentModal
        storeId={storeId}
        existingAssignments={assignments ?? []}
        pendingAssignments={pendingAssignments}
        opened={addOpened}
        onAdd={handleAddPending}
        onClose={closeAdd}
      />
    </Stack>
  );
}
