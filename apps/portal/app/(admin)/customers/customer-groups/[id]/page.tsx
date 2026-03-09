'use client';

import {
  useAdminCustomerGroup,
  useCustomersDrawerFetchOptions,
  useSaveCustomerGroup,
} from '@/core/hooks/useAdminCustomerGroup';
import { useTranslatedZodResolver } from '@org/hooks/useTranslatedZodResolver';
import { ApiError } from '@/core/lib/api/api-error';
import {
  Alert,
  Badge,
  Button,
  ColorInput,
  Divider,
  Grid,
  Group,
  Modal,
  SegmentedControl,
  Stack,
  Switch,
  Text,
  TextInput,
  Textarea,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { DATA_ACCESS_KEYS } from '@org/constants/data-keys';
import {
  CustomerGroupTypeConfigs,
  buildEnumOptions,
} from '@org/constants/enum-configs';
import {
  CustomerGroupSchema,
  NEW_CUSTOMER_GROUP_DEFAULT_VALUES,
  membershipDecisionTreeSchema,
  type CustomerGroupInput,
  type CustomerGroupOutput,
} from '@org/schemas/admin/customer-groups';
import { ADMIN_CUSTOMERS_FIELD_CONFIG } from '@org/types/admin/customers';
import type { MembershipDecisionTree } from '@org/types/rule-engine';
import { FormCard } from '@org/ui/common/form-card';
import LoadingOverlay from '@org/ui/common/loading-overlay';
import { DecisionTreeDrawer } from '@org/ui/decision-tree';
import { CronInput } from '@org/ui/inputs/cron-input';
import { RelationDrawer } from '@org/ui/inputs/relation-drawer';
import { createId } from '@paralleldrive/cuid2';
import {
  Activity,
  GitBranch,
  Save,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import {
  Controller,
  FormProvider,
  useForm,
  type SubmitHandler,
} from 'react-hook-form';

const AdminCustomerGroupPage = () => {
  const t = useTranslations('frontend.admin.customerGroups.form');
  const tEnums = useTranslations('frontend.enums');
  const locale = useLocale();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const isNew = id === 'new';
  const { data, isLoading, isError, error } = useAdminCustomerGroup(id);
  const apiError = error as ApiError | null;
  const saveCustomerGroup = useSaveCustomerGroup();
  const [treeDrawerOpened, treeDrawerHandlers] = useDisclosure(false);
  const [pendingType, setPendingType] = useState<
    'MANUAL' | 'RULE_BASED' | null
  >(null);
  const [
    confirmSwitchOpened,
    { open: openConfirmSwitch, close: closeConfirmSwitch },
  ] = useDisclosure(false);

  const formattedData = useMemo<CustomerGroupInput>(() => {
    if (!data || isNew) {
      return { ...NEW_CUSTOMER_GROUP_DEFAULT_VALUES, id: createId() };
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description ?? '',
      color: data.color ?? '',
      type: data.type,
      isActive: data.isActive,
      cronExpression: data.cronExpression ?? '0 * * * *',
      ruleTreeId: data.ruleTreeId ?? undefined,
      ruleTree: data.ruleTree
        ? {
            name: data.ruleTree.name,
            description: data.ruleTree.description ?? undefined,
            tree: (data.ruleTree as Record<string, unknown>).conditions as
              | MembershipDecisionTree
              | undefined,
            isActive: data.ruleTree.isActive,
          }
        : undefined,
      memberIds: [],
    };
  }, [data, isNew]);

  const resolver = useTranslatedZodResolver(CustomerGroupSchema);
  const methods = useForm<CustomerGroupInput>({
    resolver,
    defaultValues: NEW_CUSTOMER_GROUP_DEFAULT_VALUES,
    values: formattedData,
  });

  const {
    control,
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = methods;

  const groupName = watch('name');
  const groupType = watch('type');
  const memberIds = watch('memberIds') ?? [];

  const handleTypeChange = useCallback(
    (newType: string) => {
      const typed = newType as 'MANUAL' | 'RULE_BASED';
      const currentMemberIds = methods.getValues('memberIds') ?? [];
      const currentRuleTree = methods.getValues('ruleTree');

      if (typed === 'RULE_BASED' && currentMemberIds.length > 0) {
        setPendingType(typed);
        openConfirmSwitch();
        return;
      }

      if (typed === 'MANUAL' && currentRuleTree?.tree) {
        setPendingType(typed);
        openConfirmSwitch();
        return;
      }

      methods.setValue('type', typed, { shouldDirty: true });
      if (typed === 'RULE_BASED' && !methods.getValues('ruleTree')) {
        methods.setValue('ruleTree', {
          name: methods.getValues('name') || 'Rule Tree',
          isActive: true,
        });
      }
    },
    [methods, openConfirmSwitch]
  );

  const confirmTypeSwitch = useCallback(() => {
    if (!pendingType) return;
    if (pendingType === 'RULE_BASED') {
      methods.setValue('memberIds', [], { shouldDirty: true });
      if (!methods.getValues('ruleTree')) {
        methods.setValue('ruleTree', {
          name: methods.getValues('name') || 'Rule Tree',
          isActive: true,
        });
      }
    } else {
      methods.setValue('ruleTree', undefined, { shouldDirty: true });
      methods.setValue('ruleTreeId', undefined, { shouldDirty: true });
    }
    methods.setValue('type', pendingType, { shouldDirty: true });
    setPendingType(null);
    closeConfirmSwitch();
  }, [pendingType, methods, closeConfirmSwitch]);

  const cancelTypeSwitch = useCallback(() => {
    setPendingType(null);
    closeConfirmSwitch();
  }, [closeConfirmSwitch]);

  const onSubmit: SubmitHandler<CustomerGroupInput> = async (formData) => {
    try {
      await saveCustomerGroup.mutateAsync(
        formData as unknown as CustomerGroupOutput
      );
      router.push('/admin/customers/customer-groups');
    } catch (err) {
      const apiErr = err as ApiError;
      notifications.show({
        color: 'red',
        title: t('loadError'),
        message: apiErr?.message ?? t('loadErrorDescription'),
      });
    }
  };

  const customersFetchOptions = useCustomersDrawerFetchOptions();

  const actionRegistry = useMemo(
    () => [
      { action: 'include' as const, icon: UserPlus, color: 'teal' },
      { action: 'exclude' as const, icon: UserMinus, color: 'red' },
    ],
    []
  );

  const groupTypeOptions = useMemo(
    () => buildEnumOptions(CustomerGroupTypeConfigs, tEnums),
    [tEnums]
  );

  const fieldLabels = useMemo(
    () =>
      Object.fromEntries(
        Object.keys(ADMIN_CUSTOMERS_FIELD_CONFIG).map((key) => [
          key,
          t(`fields.${key}`),
        ])
      ),
    [t]
  );

  if (isLoading && !isNew) return <LoadingOverlay />;

  if (!isNew && isError) {
    return (
      <Stack p="md" gap="md">
        <Alert
          color="red"
          title={apiError?.isNotFound ? t('notFound') : t('loadError')}
        >
          {apiError?.isNotFound
            ? t('notFoundDescription')
            : t('loadErrorDescription')}
        </Alert>
        <Button
          variant="default"
          onClick={() => router.push('/admin/customers/customer-groups')}
        >
          {t('backToList')}
        </Button>
      </Stack>
    );
  }

  return (
    <>
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Stack gap="lg">
            <div>
              <Group justify="space-between" align="center">
                <Text size="xl" fw={700} lh={1.2}>
                  {groupName || (isNew ? t('newCustomerGroup') : '—')}
                </Text>
                <Group gap="sm">
                  <Button
                    variant="default"
                    onClick={() =>
                      router.push('/admin/customers/customer-groups')
                    }
                  >
                    {t('discard')}
                  </Button>
                  <Button
                    type="submit"
                    leftSection={<Save size={16} />}
                    loading={isSubmitting}
                  >
                    {t('save')}
                  </Button>
                </Group>
              </Group>
            </div>

            <Grid
              gutter={{ lg: 'xl', base: 'sm' }}
              style={{ alignItems: 'start' }}
            >
              <Grid.Col span={{ lg: 8, base: 12 }}>
                <Stack gap="md">
                  <FormCard
                    title={t('generalInfo')}
                    icon={Users}
                    iconColor="blue"
                  >
                    <Stack gap="md">
                      <Controller
                        control={control}
                        name="name"
                        render={({ field, fieldState }) => (
                          <TextInput
                            {...field}
                            label={t('name.label')}
                            placeholder={t('name.placeholder')}
                            error={fieldState.error?.message}
                            required
                          />
                        )}
                      />
                      <Controller
                        control={control}
                        name="description"
                        render={({ field, fieldState }) => (
                          <Textarea
                            {...field}
                            value={field.value ?? ''}
                            label={t('description.label')}
                            placeholder={t('description.placeholder')}
                            error={fieldState.error?.message}
                            autosize
                            minRows={2}
                            maxRows={4}
                          />
                        )}
                      />
                      <Controller
                        control={control}
                        name="color"
                        render={({ field, fieldState }) => (
                          <ColorInput
                            {...field}
                            value={field.value ?? ''}
                            label={t('color.label')}
                            error={fieldState.error?.message}
                          />
                        )}
                      />
                      <Controller
                        control={control}
                        name="type"
                        render={({ field }) => (
                          <div>
                            <Text size="sm" fw={500} mb={4}>
                              {t('type.label')}
                            </Text>
                            <SegmentedControl
                              value={field.value}
                              onChange={handleTypeChange}
                              data={groupTypeOptions}
                              fullWidth
                            />
                          </div>
                        )}
                      />
                    </Stack>
                  </FormCard>

                  {groupType === 'MANUAL' && (
                    <Controller
                      control={control}
                      name="memberIds"
                      render={({ field, fieldState }) => (
                        <RelationDrawer.Root
                          queryKey={DATA_ACCESS_KEYS.admin.customers.lookup}
                          fetchOptions={customersFetchOptions}
                          multiple
                          display="grid"
                          gridDisplayProps={{
                            renderItem: (item) => {
                              const email = item.extra?.email as
                                | string
                                | undefined;
                              return (
                                <Group gap="sm" wrap="nowrap">
                                  <Text size="sm" truncate>
                                    {item.label}
                                  </Text>
                                  {email && (
                                    <Text size="xs" c="dimmed" truncate>
                                      {email}
                                    </Text>
                                  )}
                                </Group>
                              );
                            },
                            removeTooltip: t('members.removeTooltip'),
                          }}
                          renderItem={(item) => {
                            const email = item.extra?.email as
                              | string
                              | undefined;
                            return (
                              <Group gap="sm" wrap="nowrap" style={{ flex: 1 }}>
                                <div style={{ minWidth: 0 }}>
                                  <Text size="sm" truncate>
                                    {item.label}
                                  </Text>
                                  {email && (
                                    <Text size="xs" c="dimmed" truncate>
                                      {email}
                                    </Text>
                                  )}
                                </div>
                              </Group>
                            );
                          }}
                          value={field.value ?? []}
                          onChange={field.onChange}
                        >
                          <FormCard
                            title={t('members.title')}
                            description={t('members.description')}
                            icon={Users}
                            iconColor="teal"
                            rightSection={
                              <Group gap="sm">
                                {(field.value?.length ?? 0) > 0 && (
                                  <Badge color="teal" variant="light">
                                    {field.value?.length ?? 0}
                                  </Badge>
                                )}
                                <RelationDrawer.Trigger
                                  placeholder={t('members.addButton')}
                                  error={fieldState.error?.message}
                                  compact
                                />
                              </Group>
                            }
                          >
                            <RelationDrawer.GridDisplay />
                          </FormCard>
                          <RelationDrawer.Content
                            title={t('members.modalTitle')}
                          >
                            <RelationDrawer.FlatList />
                          </RelationDrawer.Content>
                        </RelationDrawer.Root>
                      )}
                    />
                  )}

                  {groupType === 'RULE_BASED' && (
                    <FormCard
                      title={t('ruleTree.title')}
                      description={t('ruleTree.description')}
                      icon={GitBranch}
                      iconColor="violet"
                    >
                      <Controller
                        control={control}
                        name="ruleTree.tree"
                        render={({ field }) => (
                          <>
                            <Button
                              variant="light"
                              leftSection={<GitBranch size={16} />}
                              onClick={treeDrawerHandlers.open}
                            >
                              {t('tree.editTree')}
                            </Button>
                            <DecisionTreeDrawer
                              opened={treeDrawerOpened}
                              onClose={treeDrawerHandlers.close}
                              value={
                                field.value as
                                  | MembershipDecisionTree
                                  | undefined
                              }
                              onChange={field.onChange}
                              schema={membershipDecisionTreeSchema}
                              fieldConfig={ADMIN_CUSTOMERS_FIELD_CONFIG}
                              mode="simple"
                              actionRegistry={actionRegistry}
                              fieldLabels={fieldLabels}
                            />
                          </>
                        )}
                      />
                    </FormCard>
                  )}
                </Stack>
              </Grid.Col>
              <Grid.Col span={{ lg: 4, base: 12 }}>
                <Stack
                  gap="md"
                  style={{
                    position: 'sticky',
                    top: 'var(--mantine-spacing-md)',
                  }}
                >
                  <FormCard
                    title={t('statusCard.title')}
                    icon={Activity}
                    iconColor="orange"
                  >
                    <Stack gap="md">
                      <Controller
                        control={control}
                        name="isActive"
                        render={({ field }) => (
                          <Switch
                            checked={field.value}
                            onChange={field.onChange}
                            label={t('statusCard.activeLabel')}
                          />
                        )}
                      />
                      {groupType === 'RULE_BASED' && (
                        <>
                          <Divider />
                          <Controller
                            control={control}
                            name="cronExpression"
                            render={({ field, fieldState }) => (
                              <CronInput
                                value={field.value}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                label={t('cronExpression.label')}
                                description={t('cronExpression.description')}
                                error={fieldState.error?.message}
                                locale={locale}
                              />
                            )}
                          />
                        </>
                      )}
                    </Stack>
                  </FormCard>
                </Stack>
              </Grid.Col>
            </Grid>
          </Stack>
        </form>
      </FormProvider>

      <Modal
        opened={confirmSwitchOpened}
        onClose={cancelTypeSwitch}
        title={t('confirmSwitch.title')}
        centered
        size="sm"
      >
        <Stack gap="md">
          <Text size="sm">
            {pendingType === 'RULE_BASED'
              ? t('confirmSwitch.toRuleBased', { count: memberIds.length })
              : t('confirmSwitch.toManual')}
          </Text>
          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={cancelTypeSwitch}>
              {t('confirmSwitch.cancel')}
            </Button>
            <Button color="red" onClick={confirmTypeSwitch}>
              {t('confirmSwitch.confirm')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
};

export default AdminCustomerGroupPage;
