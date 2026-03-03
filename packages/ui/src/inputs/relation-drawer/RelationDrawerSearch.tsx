'use client';

import { TextInput } from '@mantine/core';
import { Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRelationDrawer } from './context';

export function RelationDrawerSearch() {
  const t = useTranslations('frontend.relationModal');
  const { search, setSearch } = useRelationDrawer();

  return (
    <TextInput
      value={search}
      onChange={(e) => setSearch(e.currentTarget.value)}
      placeholder={t('search')}
      leftSection={<Search size={16} />}
      rightSection={
        search ? (
          <X
            size={14}
            style={{ cursor: 'pointer' }}
            onClick={() => setSearch('')}
          />
        ) : null
      }
      variant="filled"
    />
  );
}
