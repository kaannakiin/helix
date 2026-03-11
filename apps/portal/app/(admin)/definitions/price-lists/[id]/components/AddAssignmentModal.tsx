'use client';

import {
  customerGroupQueryFetcher,
  customerQueryFetcher,
  organizationQueryFetcher,
  createStoreCustomerGroupFetcher,
  createStoreOrganizationFetcher,
  createStoreCustomerFetcher,
  DATA_ACCESS_KEYS,
} from '@/core/hooks/useAdminLookup';
import {
  Alert,
  Button,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
} from '@mantine/core';
import type { PriceListAssignment } from '@org/prisma/browser';
import {
  AssignmentTargetTypeConfigs,
  buildEnumOptions,
} from '@org/constants/enum-configs';
import { useTranslatedZodResolver } from '@org/hooks/useTranslatedZodResolver';
import {
  PriceListAssignmentCreateSchema,
  type PriceListAssignmentCreateInput,
} from '@org/schemas/admin/pricing';
import { RelationInput } from '@org/ui/inputs/relation-input';
import { Info } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

interface AddAssignmentModalProps {
  storeId: string | null;
  existingAssignments: PriceListAssignment[];
  pendingAssignments: PriceListAssignmentCreateInput[];
  opened: boolean;
  onAdd: (data: PriceListAssignmentCreateInput, label: string) => void;
  onClose: () => void;
}

const DEFAULT_VALUES: PriceListAssignmentCreateInput = {
  targetType: 'ALL_CUSTOMERS',
  customerGroupId: null,
  organizationId: null,
  customerId: null,
  priority: 0,
};

export function AddAssignmentModal({
  storeId,
  existingAssignments,
  pendingAssignments,
  opened,
  onAdd,
  onClose,
}: AddAssignmentModalProps) {
  const tEnums = useTranslations('frontend.enums');
  const tModal = useTranslations(
    'frontend.admin.priceLists.form.assignments.modal'
  );

  const resolver = useTranslatedZodResolver(PriceListAssignmentCreateSchema);

  const { control, handleSubmit, watch, setValue, reset } =
    useForm<PriceListAssignmentCreateInput>({
      resolver,
      defaultValues: DEFAULT_VALUES,
    });

  const targetType = watch('targetType');
  const [selectedLabel, setSelectedLabel] = useState<string>('');

  useEffect(() => {
    setValue('customerGroupId', null);
    setValue('organizationId', null);
    setValue('customerId', null);
    setSelectedLabel('');
  }, [targetType, setValue]);

  const customerGroupFetcher = useMemo(
    () => storeId ? createStoreCustomerGroupFetcher(storeId) : customerGroupQueryFetcher,
    [storeId]
  );
  const organizationFetcher = useMemo(
    () => storeId ? createStoreOrganizationFetcher(storeId) : organizationQueryFetcher,
    [storeId]
  );
  const customerFetcher = useMemo(
    () => storeId ? createStoreCustomerFetcher(storeId) : customerQueryFetcher,
    [storeId]
  );

  const targetTypeOptions = buildEnumOptions(
    AssignmentTargetTypeConfigs,
    tEnums
  );

  const hasAllCustomers =
    existingAssignments.some((a) => a.targetType === 'ALL_CUSTOMERS') ||
    pendingAssignments.some((a) => a.targetType === 'ALL_CUSTOMERS');

  const filteredTargetTypeOptions = targetTypeOptions.filter((opt) => {
    if (opt.value === 'ALL_CUSTOMERS' && hasAllCustomers) return false;
    return true;
  });

  const onSubmit = (data: PriceListAssignmentCreateInput) => {
    const label =
      data.targetType === 'ALL_CUSTOMERS'
        ? tModal('allCustomersInfo')
        : selectedLabel;
    onAdd(data, label);
    reset(DEFAULT_VALUES);
  };

  const handleClose = () => {
    reset(DEFAULT_VALUES);
    onClose();
  };

  const customerGroupQueryKey = useMemo(
    () => [...DATA_ACCESS_KEYS.admin.customerGroups.list, storeId ?? 'all'],
    [storeId]
  );
  const organizationQueryKey = useMemo(
    () => [...DATA_ACCESS_KEYS.admin.organizations.list, storeId ?? 'all'],
    [storeId]
  );
  const customerQueryKey = useMemo(
    () => [...DATA_ACCESS_KEYS.admin.customers.list, storeId ?? 'all'],
    [storeId]
  );

  return (
    <Modal opened={opened} onClose={handleClose} title={tModal('title')} returnFocus={false}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack gap="md">
          <Controller
            name="targetType"
            control={control}
            render={({ field, fieldState }) => (
              <Select
                {...field}
                label={tModal('targetType.label')}
                placeholder={tModal('targetType.placeholder')}
                data={filteredTargetTypeOptions}
                error={fieldState.error?.message}
                required
              />
            )}
          />

          {targetType === 'ALL_CUSTOMERS' && (
            <Alert icon={<Info size={16} />} color="blue" variant="light">
              {tModal('allCustomersInfo')}
            </Alert>
          )}

          {targetType === 'CUSTOMER_GROUP' && (
            <Controller
              name="customerGroupId"
              control={control}
              render={({ field, fieldState }) => (
                <RelationInput
                  fetchOptions={customerGroupFetcher}
                  queryKey={customerGroupQueryKey}
                  value={field.value ?? null}
                  onChange={field.onChange}
                  onSelectItem={(item) => setSelectedLabel(item.label)}
                  label={tModal('customerGroup.label')}
                  placeholder={tModal('customerGroup.placeholder')}
                  error={fieldState.error?.message}
                  clearable
                  required
                />
              )}
            />
          )}

          {targetType === 'ORGANIZATION' && (
            <Controller
              name="organizationId"
              control={control}
              render={({ field, fieldState }) => (
                <RelationInput
                  fetchOptions={organizationFetcher}
                  queryKey={organizationQueryKey}
                  value={field.value ?? null}
                  onChange={field.onChange}
                  onSelectItem={(item) => setSelectedLabel(item.label)}
                  label={tModal('organization.label')}
                  placeholder={tModal('organization.placeholder')}
                  error={fieldState.error?.message}
                  clearable
                  required
                />
              )}
            />
          )}

          {targetType === 'CUSTOMER' && (
            <Controller
              name="customerId"
              control={control}
              render={({ field, fieldState }) => (
                <RelationInput
                  fetchOptions={customerFetcher}
                  queryKey={customerQueryKey}
                  value={field.value ?? null}
                  onChange={field.onChange}
                  onSelectItem={(item) => setSelectedLabel(item.label)}
                  label={tModal('customer.label')}
                  placeholder={tModal('customer.placeholder')}
                  error={fieldState.error?.message}
                  clearable
                  required
                />
              )}
            />
          )}

          <Controller
            name="priority"
            control={control}
            render={({ field, fieldState }) => (
              <NumberInput
                value={field.value}
                onChange={field.onChange}
                label={tModal('priority.label')}
                min={0}
                error={fieldState.error?.message}
              />
            )}
          />

          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={handleClose}>
              {tModal('cancel')}
            </Button>
            <Button type="submit">
              {tModal('addToList')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
