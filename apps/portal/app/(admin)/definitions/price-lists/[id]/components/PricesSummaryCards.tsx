'use client';

import { useAdminPriceListPricesSummary } from '@/core/hooks/useAdminPriceListPrices';
import { Badge, Group, Paper, SimpleGrid, Skeleton, Text } from '@mantine/core';
import { useTranslations } from 'next-intl';

interface PricesSummaryCardsProps {
  priceListId: string;
}

export function PricesSummaryCards({ priceListId }: PricesSummaryCardsProps) {
  const t = useTranslations('frontend.admin.priceLists.form.prices.summary');
  const { data, isLoading } = useAdminPriceListPricesSummary(priceListId);

  if (isLoading) {
    return (
      <SimpleGrid cols={{ base: 2, sm: 4 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} height={80} radius="md" />
        ))}
      </SimpleGrid>
    );
  }

  return (
    <SimpleGrid cols={{ base: 2, sm: 4 }}>
      <Paper p="md" radius="md" withBorder>
        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
          {t('totalRows')}
        </Text>
        <Text size="xl" fw={700} mt={4}>
          {data?.totalRows ?? 0}
        </Text>
      </Paper>

      <Paper p="md" radius="md" withBorder>
        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
          {t('currencies')}
        </Text>
        <Group gap={4} mt={4}>
          {(data?.currencies ?? []).length > 0 ? (
            data!.currencies.map((c) => (
              <Badge key={c} variant="light" size="sm">
                {c}
              </Badge>
            ))
          ) : (
            <Text size="sm" c="dimmed">
              —
            </Text>
          )}
        </Group>
      </Paper>

      <Paper p="md" radius="md" withBorder>
        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
          {t('lockedRows')}
        </Text>
        <Text size="xl" fw={700} mt={4}>
          {data?.lockedRows ?? 0}
        </Text>
      </Paper>

      <Paper p="md" radius="md" withBorder>
        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
          {t('missingPrices')}
        </Text>
        <Text
          size="xl"
          fw={700}
          mt={4}
          c={(data?.missingPrices ?? 0) > 0 ? 'red' : undefined}
        >
          {data?.missingPrices ?? 0}
        </Text>
      </Paper>
    </SimpleGrid>
  );
}
