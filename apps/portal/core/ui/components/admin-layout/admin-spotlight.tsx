'use client';

import {
  getQuickActionItems,
  getSpotlightItems,
} from '@/core/config/navigation';
import { useMediaQuery } from '@mantine/hooks';
import {
  Spotlight,
  type SpotlightActionData,
  type SpotlightActionGroupData,
} from '@mantine/spotlight';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

export function AdminSpotlight() {
  const t = useTranslations('frontend.nav');
  const router = useRouter();
  const spotlightItems = getSpotlightItems();
  const quickActionItems = getQuickActionItems();
  const isTablet = useMediaQuery('(max-width: 768px)');
  const isPhone = useMediaQuery('(max-width: 480px)');

  const navigationActions: SpotlightActionData[] = spotlightItems.map(
    (item) => ({
      id: item.key,
      label: t(item.key),
      description: item.description,
      leftSection: <item.icon size={20} />,
      onClick: () => router.push(item.href),
      keywords: [item.key, item.group ?? ''],
    })
  );

  const quickActions: SpotlightActionData[] = quickActionItems.map((item) => ({
    id: `add_${item.key}`,
    label: t(`add_${item.key}`),
    description: item.description,
    leftSection: <Plus size={20} />,
    onClick: () => router.push(item.quickActionHref!),
    keywords: [item.key, item.group ?? '', 'add', 'new', 'ekle', 'yeni'],
  }));

  const actions: (SpotlightActionGroupData | SpotlightActionData)[] = [
    { group: t('quick_actions'), actions: quickActions },
    { group: t('navigation'), actions: navigationActions },
  ];

  return (
    <Spotlight
      actions={actions}
      shortcut={['mod + K']}
      nothingFound={t('search_nothing_found')}
      searchProps={{
        placeholder: t('search_placeholder'),
      }}
      highlightQuery
      limit={isPhone ? 5 : isTablet ? 8 : 15}
    />
  );
}
