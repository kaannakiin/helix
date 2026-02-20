'use client';

import { Text, Title } from '@mantine/core';
import { useTranslations } from 'next-intl';

export default function AdminDashboardPage() {
  const t = useTranslations('common.nav');

  return (
    <div>
      <Title order={2}>{t('dashboard')}</Title>
      <Text c="dimmed" mt="sm">
        Welcome to the admin dashboard.
      </Text>
    </div>
  );
}
