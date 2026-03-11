'use client';

import { getSpotlightItems } from '@/core/config/navigation';
import { useMediaQuery } from '@mantine/hooks';
import {
  Spotlight,
  type SpotlightActionData,
  type SpotlightActionGroupData,
} from '@mantine/spotlight';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

export function AdminSpotlight() {
  const t = useTranslations('frontend.nav');
  const router = useRouter();
  const spotlightItems = getSpotlightItems();
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

  const actions: (SpotlightActionGroupData | SpotlightActionData)[] = [
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
