'use client';

import {
  useCheckVariantGroupSlug,
  useVariantGroupDetail,
  useVariantGroupSearch,
  type VariantGroupLookupItem,
} from '@/core/hooks/useAdminProducts';
import {
  Badge,
  Button,
  ColorSwatch,
  Group,
  Loader,
  Modal,
  Radio,
  ScrollArea,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { Locale, VariantGroupType } from '@org/prisma/browser';
import type { VariantGroupInput } from '@org/schemas/admin/variants';
import { slugify } from '@org/utils/slugify';
import { createId } from '@paralleldrive/cuid2';
import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

function checkLocalSlugConflict(
  name: string,
  existingGroups: VariantGroupInput[],
  excludeGroupId?: string
): boolean {
  const slugLocales = Object.values(Locale).map((v) => v.toLowerCase());
  const candidateSlugs = new Set(
    slugLocales.map((locale) => slugify(name, locale))
  );

  for (const group of existingGroups) {
    if (excludeGroupId && group.uniqueId === excludeGroupId) continue;
    for (const trans of group.translations) {
      const existingSlug =
        trans.slug || slugify(trans.name, trans.locale.toLowerCase());
      if (candidateSlugs.has(existingSlug)) {
        return true;
      }
    }
  }
  return false;
}

function checkExistingGroupLocalConflict(
  group: VariantGroupInput,
  existingGroups: VariantGroupInput[]
): boolean {
  for (const trans of group.translations) {
    const slug = trans.slug || slugify(trans.name, trans.locale.toLowerCase());
    for (const existing of existingGroups) {
      for (const existingTrans of existing.translations) {
        const existingSlug =
          existingTrans.slug ||
          slugify(existingTrans.name, existingTrans.locale.toLowerCase());
        if (slug === existingSlug) {
          return true;
        }
      }
    }
  }
  return false;
}

interface Props {
  opened: boolean;
  onClose: () => void;
  onAdd: (group: VariantGroupInput) => void;
  existingGroupIds: string[];
  existingGroups: VariantGroupInput[];
  hasColorGroup: boolean;
}

type Tab = 'existing' | 'new';

export const AddVariantGroupModal = ({
  opened,
  onClose,
  onAdd,
  existingGroupIds,
  existingGroups,
  hasColorGroup,
}: Props) => {
  const t = useTranslations('frontend.admin.products.form');
  const tEnums = useTranslations('frontend.enums');

  const [tab, setTab] = useState<Tab>('existing');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchQuery, 300);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);

  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupType, setNewGroupType] = useState<VariantGroupType>(
    VariantGroupType.SIZE
  );

  const checkSlugMutation = useCheckVariantGroupSlug();

  useEffect(() => {
    if (hasColorGroup && newGroupType === VariantGroupType.COLOR) {
      setNewGroupType(VariantGroupType.SIZE);
    }
  }, [hasColorGroup, newGroupType]);

  const { data: groups = [], isLoading: loadingGroups } = useVariantGroupSearch(
    debouncedSearch,
    tab === 'existing' && opened,
    existingGroupIds
  );

  const { data: selectedGroup, isFetching: loadingAdd } = useVariantGroupDetail(
    tab === 'existing' ? selectedGroupId : null
  );

  const handleAddExisting = () => {
    if (!selectedGroup) return;
    setSlugError(null);

    const mapped: VariantGroupInput = {
      uniqueId: selectedGroup.id,
      type: selectedGroup.type,
      sortOrder: selectedGroup.sortOrder,
      translations: selectedGroup.translations.map((tr) => ({
        locale: tr.locale,
        name: tr.name,
        slug: tr.slug,
      })),
      options: selectedGroup.options.map((opt) => ({
        uniqueId: opt.id,
        colorCode: opt.colorCode ?? '',
        sortOrder: opt.sortOrder,
        translations: opt.translations.map((tr) => ({
          locale: tr.locale,
          name: tr.name,
          slug: tr.slug,
        })),
        images: undefined,
        existingImages: opt.images.map((img) => ({
          id: img.id,
          url: img.url,
          fileType: img.fileType,
          sortOrder: img.sortOrder,
        })),
      })),
    };

    if (checkExistingGroupLocalConflict(mapped, existingGroups)) {
      setSlugError(t('variants.modal.slugExistsOnProduct'));
      return;
    }

    onAdd(mapped);
    handleClose();
  };

  const handleAddNew = async () => {
    if (!newGroupName.trim()) return;
    setSlugError(null);

    const name = newGroupName.trim();

    if (checkLocalSlugConflict(name, existingGroups)) {
      setSlugError(t('variants.modal.slugExistsOnProduct'));
      return;
    }

    try {
      const result = await checkSlugMutation.mutateAsync({
        name,
        excludeIds: existingGroupIds,
      });
      if (result.exists) {
        setSlugError(t('variants.modal.slugExistsInDatabase'));
        return;
      }
    } catch {
      setSlugError(t('variants.modal.slugCheckFailed'));
      return;
    }

    const newGroup: VariantGroupInput = {
      uniqueId: createId(),
      type: newGroupType,
      sortOrder: 0,
      translations: [{ locale: 'TR', name: name, slug: slugify(name, 'tr') }],
      options: [],
    };
    onAdd(newGroup);
    handleClose();
  };

  const handleClose = () => {
    setSearchQuery('');
    setSelectedGroupId(null);
    setNewGroupName('');
    setNewGroupType(VariantGroupType.SIZE);
    setSlugError(null);
    setTab('existing');
    onClose();
  };

  const handleTabChange = (v: string) => {
    setSlugError(null);
    setTab(v as Tab);
  };

  const typeColor = (type?: VariantGroupType) =>
    type === VariantGroupType.COLOR ? 'pink' : 'blue';

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Text fw={600} size="lg">
          {t('variants.modal.title')}
        </Text>
      }
      size="lg"
      padding="xl"
      centered
    >
      <Stack gap={'xs'}>
        <SegmentedControl
          value={tab}
          onChange={handleTabChange}
          data={[
            { value: 'existing', label: t('variants.modal.existing') },
            { value: 'new', label: t('variants.modal.new') },
          ]}
          fullWidth
        />

        {tab === 'existing' && (
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              {t('variants.modal.searchDescription')}
            </Text>

            <TextInput
              leftSection={<Search size={16} />}
              placeholder={t('variants.modal.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
            />

            <ScrollArea h={320} offsetScrollbars>
              <Stack gap="xs">
                {loadingGroups ? (
                  <Group justify="center" py="xl">
                    <Loader size="sm" />
                  </Group>
                ) : groups.length === 0 ? (
                  !searchQuery?.length ? (
                    <Text size="sm" c="dimmed" ta="center" py="xl">
                      {t('variants.modal.searchGroups')}
                    </Text>
                  ) : (
                    <Text size="sm" c="dimmed" ta="center" py="xl">
                      {t('variants.modal.noGroups')}
                    </Text>
                  )
                ) : (
                  groups.map((group: VariantGroupLookupItem) => {
                    const isSelected = selectedGroupId === group.id;
                    const optionPrev =
                      group.extra?.optionLabels?.slice(0, 5) ?? [];
                    const type = group.extra?.type;
                    const isColorDisabled =
                      hasColorGroup && type === VariantGroupType.COLOR;

                    return (
                      <UnstyledButton
                        key={group.id}
                        onClick={() =>
                          !isColorDisabled && setSelectedGroupId(group.id)
                        }
                        style={(theme) => ({
                          border: `1px solid ${
                            isSelected
                              ? theme.colors.blue[5]
                              : theme.colors.gray[2]
                          }`,
                          borderRadius: theme.radius.md,
                          padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                          backgroundColor: isSelected
                            ? theme.colors.blue[0]
                            : theme.white,
                          transition: 'all 0.1s ease',
                          opacity: isColorDisabled ? 0.5 : 1,
                          cursor: isColorDisabled ? 'not-allowed' : 'pointer',
                        })}
                      >
                        <Group justify="space-between" wrap="nowrap">
                          <Group gap="xs" wrap="nowrap">
                            <div
                              style={{
                                width: 18,
                                height: 18,
                                borderRadius: '50%',
                                border: `2px solid ${
                                  isSelected
                                    ? 'var(--mantine-color-blue-5)'
                                    : 'var(--mantine-color-gray-4)'
                                }`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              {isSelected && (
                                <div
                                  style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    backgroundColor:
                                      'var(--mantine-color-blue-5)',
                                  }}
                                />
                              )}
                            </div>

                            <Stack gap={2}>
                              <Text size="sm" fw={500}>
                                {group.label}
                              </Text>
                              {isColorDisabled ? (
                                <Text size="xs" c="red.5">
                                  {t('variants.modal.colorGroupExists')}
                                </Text>
                              ) : (
                                optionPrev.length > 0 && (
                                  <Text size="xs" c="dimmed">
                                    {optionPrev.join(', ')}
                                    {(group.extra?.optionLabels?.length ?? 0) >
                                      5 && '...'}
                                  </Text>
                                )
                              )}
                            </Stack>
                          </Group>

                          {type && (
                            <Badge
                              color={typeColor(type)}
                              variant="light"
                              size="sm"
                            >
                              {tEnums(`variantGroupType.${type}`)}
                            </Badge>
                          )}
                        </Group>
                      </UnstyledButton>
                    );
                  })
                )}
              </Stack>
            </ScrollArea>

            {slugError && (
              <Text size="sm" c="red">
                {slugError}
              </Text>
            )}

            <Group justify="flex-end" pt="sm">
              <Button variant="default" onClick={handleClose}>
                {t('variants.modal.cancel')}
              </Button>
              <Button
                onClick={handleAddExisting}
                disabled={!selectedGroupId || loadingAdd || !selectedGroup}
                leftSection={loadingAdd ? <Loader size={14} /> : undefined}
              >
                {t('variants.modal.add')}
              </Button>
            </Group>
          </Stack>
        )}

        {tab === 'new' && (
          <Stack gap="md">
            <Radio.Group
              label={t('variants.modal.groupType')}
              value={newGroupType}
              onChange={(v) => v && setNewGroupType(v as VariantGroupType)}
            >
              <Group gap="sm" mt="xs">
                <Radio.Card
                  value={VariantGroupType.SIZE}
                  p="sm"
                  radius="md"
                  withBorder
                  style={{ flex: 1 }}
                >
                  <Group gap="xs" wrap="nowrap">
                    <Radio.Indicator />
                    <Stack gap={2}>
                      <Text size="sm" fw={500}>
                        {tEnums('variantGroupType.SIZE')}
                      </Text>
                      <Group gap={4}>
                        <Badge size="xs" variant="outline">
                          S
                        </Badge>
                        <Badge size="xs" variant="outline">
                          M
                        </Badge>
                        <Badge size="xs" variant="outline">
                          L
                        </Badge>
                      </Group>
                    </Stack>
                  </Group>
                </Radio.Card>

                <Radio.Card
                  value={VariantGroupType.COLOR}
                  p="sm"
                  radius="md"
                  withBorder
                  style={{
                    flex: 1,
                    opacity: hasColorGroup ? 0.5 : 1,
                    cursor: hasColorGroup ? 'not-allowed' : 'pointer',
                    pointerEvents: hasColorGroup ? 'none' : 'auto',
                  }}
                >
                  <Group gap="xs" wrap="nowrap">
                    <Radio.Indicator />
                    <Stack gap={2}>
                      <Text size="sm" fw={500}>
                        {tEnums('variantGroupType.COLOR')}
                      </Text>
                      <Group gap={4}>
                        <ColorSwatch color="#ff0000" size={14} />
                        <ColorSwatch color="#0000ff" size={14} />
                        <ColorSwatch color="#000000" size={14} />
                      </Group>
                    </Stack>
                  </Group>
                </Radio.Card>
              </Group>
            </Radio.Group>

            <TextInput
              label={t('variants.modal.groupName')}
              placeholder={t('variants.modal.groupNamePlaceholder')}
              value={newGroupName}
              onChange={(e) => {
                setNewGroupName(e.currentTarget.value);
                setSlugError(null);
              }}
              error={slugError}
              data-autofocus
            />

            <Group justify="flex-end" pt="sm">
              <Button variant="default" onClick={handleClose}>
                {t('variants.modal.cancel')}
              </Button>
              <Button
                onClick={handleAddNew}
                disabled={!newGroupName.trim() || checkSlugMutation.isPending}
                loading={checkSlugMutation.isPending}
              >
                {t('variants.modal.add')}
              </Button>
            </Group>
          </Stack>
        )}
      </Stack>
    </Modal>
  );
};
