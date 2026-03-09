'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ActionIcon,
  Avatar,
  Badge,
  Button,
  Card,
  ColorSwatch,
  Group,
  Stack,
  Text,
} from '@mantine/core';

import { VariantGroupType } from '@org/prisma/browser';
import type { ProductInputType } from '@org/schemas/admin/products';
import { ConfirmPopover } from '@org/ui/common/confirm-popover';
import { GripVertical } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

interface Props {
  fieldId: string;
  index: number;
  onOpen: () => void;
  onRemove: () => void;
}

export const VariantGroupCard = ({
  fieldId,
  index,
  onOpen,
  onRemove,
}: Props) => {
  const t = useTranslations('frontend.admin.products.form');
  const { control } = useFormContext<ProductInputType>();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: fieldId });

  const group = useWatch({ control, name: `variantGroups.${index}` });

  const groupName =
    group?.translations?.[0]?.name || t('variants.unnamedGroup');
  const isColor = group?.type === VariantGroupType.COLOR;
  const options = group?.options ?? [];

  const [newImageUrls, setNewImageUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    const map: Record<string, string> = {};
    for (const opt of options) {
      const dropzoneFile = opt.images?.[0];
      if (dropzoneFile?.file instanceof File) {
        map[opt.uniqueId] = URL.createObjectURL(dropzoneFile.file);
      }
    }
    setNewImageUrls(map);

    return () => {
      for (const url of Object.values(map)) {
        URL.revokeObjectURL(url);
      }
    };
  }, [options.map((o) => o.images?.[0]?.id).join(',')]);

  return (
    <Card
      ref={setNodeRef}
      withBorder
      radius="sm"
      p="sm"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        cursor: 'default',
      }}
    >
      <Stack gap="xs">
        <Group justify="space-between" align="center" wrap="nowrap">
          <Group gap="xs" wrap="nowrap">
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
              aria-label="Drag to reorder"
              {...attributes}
              {...listeners}
            >
              <GripVertical size={16} />
            </ActionIcon>

            <Text fw={600} size="sm">
              {groupName}
            </Text>

            {index === 0 && (
              <Badge size="xs" color="blue" variant="light">
                {t('variants.primary')}
              </Badge>
            )}
          </Group>

          <Group gap="xs" wrap="nowrap">
            <Button size="xs" onClick={onOpen}>
              {t('variants.openGroup')}
            </Button>
            <ConfirmPopover
              label={t('variants.confirmRemoveGroup')}
              confirmLabel={t('variants.confirm')}
              cancelLabel={t('variants.cancel')}
              onConfirm={onRemove}
              confirmColor="red"
            >
              <Button color="red" size="xs">
                {t('variants.removeGroup')}
              </Button>
            </ConfirmPopover>
          </Group>
        </Group>

        {options.length === 0 ? (
          <Text size="xs" c="dimmed">
            {t('variants.noOptions')}
          </Text>
        ) : (
          <Group gap={8} wrap="wrap" align="center" justify="center">
            {options.slice(0, 5).map((opt) => {
              const existingUrl = opt.existingImages?.[0]?.url;
              const imageUrl = newImageUrls[opt.uniqueId] ?? existingUrl;
              const hasImage = !!imageUrl;
              const name =
                opt.translations?.[0]?.name || t('variants.unnamedOption');

              if (isColor) {
                const visual = hasImage ? (
                  <Avatar src={imageUrl} size={28} radius="sm" />
                ) : opt.colorCode ? (
                  <ColorSwatch color={opt.colorCode} size={28} />
                ) : (
                  <ColorSwatch color="#cccccc" size={28} />
                );
                return (
                  <Group
                    key={opt.uniqueId}
                    gap={6}
                    wrap="nowrap"
                    align="center"
                    style={(theme) => ({
                      backgroundColor: theme.colors.gray[0],
                      borderRadius: theme.radius.sm,
                      padding: '3px 8px 3px 4px',
                    })}
                  >
                    {visual}
                    <Text size="xs" fw={500}>
                      {name}
                    </Text>
                  </Group>
                );
              }

              return (
                <Badge
                  key={opt.uniqueId}
                  size="sm"
                  variant="outline"
                  radius="sm"
                >
                  {name}
                </Badge>
              );
            })}
            {options.length > 5 && (
              <Badge size="sm" variant="filled" color="gray" radius="sm">
                +{options.length - 5}
              </Badge>
            )}
          </Group>
        )}
      </Stack>
    </Card>
  );
};
