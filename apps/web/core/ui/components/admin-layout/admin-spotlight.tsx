'use client';

import { getSpotlightItems } from '@/core/config/navigation';
import { Spotlight, type SpotlightActionData } from '@mantine/spotlight';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

export function AdminSpotlight() {
  const t = useTranslations('common.nav');
  const router = useRouter();
  const spotlightItems = getSpotlightItems();

  const actions: SpotlightActionData[] = spotlightItems.map((item) => ({
    id: item.key,
    label: t(item.key),
    description: item.description,
    leftSection: <item.icon size={20} />,
    onClick: () => router.push(item.href),
    keywords: [item.key, item.group ?? ''],
  }));

  return (
    <Spotlight
      actions={actions}
      shortcut={['mod + K']}
      nothingFound={t('search_nothing_found')}
      searchProps={{
        placeholder: t('search_placeholder'),
      }}
      highlightQuery
    />
  );
}
