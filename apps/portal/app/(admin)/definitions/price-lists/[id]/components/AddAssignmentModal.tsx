'use client';

import { useCreatePriceListAssignment } from '@/core/hooks/useAdminPriceListAssignments';
import {
  customerGroupQueryFetcher,
  customerQueryFetcher,
  DATA_ACCESS_KEYS,
  organizationQueryFetcher,
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
import { notifications } from '@mantine/notifications';
import type { PriceListAssignment } from '@org/prisma/browser';
import {
  AssignmentTargetTypeConfigs,
  buildEnumOptions,
} from '@org/constants/enum-configs';
import { useTranslatedZodResolver } from '@org/hooks/useTranslatedZodResolver';
import {
  PriceListAssignmentCreateSchema,
  type PriceListAssignmentCreateInput,
  type PriceListAssignmentCreateOutput,
} from '@org/schemas/admin/pricing';
import { RelationInput } from '@org/ui/inputs/relation-input';
import { Info } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';

interface AddAssignmentModalProps {
  priceListId: string;
  existingAssignments: PriceListAssignment[];
  opened: boolean;
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
  priceListId,
  existingAssignments,
  opened,
  onClose,
}: AddAssignmentModalProps) {
  const t = useTranslations('frontend.admin.priceLists.form.assignments');
  const tEnums = useTranslations('frontend.enums');
  const tModal = useTranslations(
    'frontend.admin.priceLists.form.assignments.modal'
  );

  const createAssignment = useCreatePriceListAssignment(priceListId);
  const resolver = useTranslatedZodResolver(PriceListAssignmentCreateSchema);

  const { control, handleSubmit, watch, setValue, reset } =
    useForm<PriceListAssignmentCreateInput>({
      resolver,
      defaultValues: DEFAULT_VALUES,
    });

  const targetType = watch('targetType');

  // Reset relation fields when target type changes
  useEffect(() => {
    setValue('customerGroupId', null);
    setValue('organizationId', null);
    setValue('customerId', null);
  }, [targetType, setValue]);

  const targetTypeOptions = buildEnumOptions(
    AssignmentTargetTypeConfigs,
    tEnums
  );

  const hasAllCustomers = existingAssignments.some(
    (a) => a.targetType === 'ALL_CUSTOMERS'
  );

  const filteredTargetTypeOptions = targetTypeOptions.filter((opt) => {
    if (opt.value === 'ALL_CUSTOMERS' && hasAllCustomers) return false;
    return true;
  });

  const onSubmit = async (data: PriceListAssignmentCreateInput) => {
    try {
      await createAssignment.mutateAsync(
        data as PriceListAssignmentCreateOutput
      );
      notifications.show({ color: 'green', message: t('saveSuccess') });
      reset(DEFAULT_VALUES);
      onClose();
    } catch {
      notifications.show({ color: 'red', message: t('saveError') });
    }
  };

  const handleClose = () => {
    reset(DEFAULT_VALUES);
    onClose();
  };

  return (
    <Modal opened={opened} onClose={handleClose} title={tModal('title')}>
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
                  fetchOptions={customerGroupQueryFetcher}
                  queryKey={DATA_ACCESS_KEYS.admin.customerGroups.list}
                  value={field.value ?? null}
                  onChange={field.onChange}
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
                  fetchOptions={organizationQueryFetcher}
                  queryKey={DATA_ACCESS_KEYS.admin.organizations.list}
                  value={field.value ?? null}
                  onChange={field.onChange}
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
                  fetchOptions={customerQueryFetcher}
                  queryKey={DATA_ACCESS_KEYS.admin.customers.list}
                  value={field.value ?? null}
                  onChange={field.onChange}
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
            <Button type="submit" loading={createAssignment.isPending}>
              {tModal('add')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
