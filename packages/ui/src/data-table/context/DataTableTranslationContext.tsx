'use client';

import { useEffect, type ReactNode } from 'react';
import {
  useDataTableTranslationStore,
  type DataTableTranslations,
} from '../store/data-table-translation-store';

export {
  DEFAULT_TRANSLATIONS,
  useDataTableTranslationStore,
  useDataTableTranslations,
  type DataTableFilterTranslations,
  type DataTableTranslations,
} from '../store/data-table-translation-store';

export function DataTableTranslationProvider({
  translations,
  children,
}: {
  translations?: DataTableTranslations;
  children: ReactNode;
}) {
  const setTranslations = useDataTableTranslationStore(
    (s) => s.setTranslations
  );

  useEffect(() => {
    if (translations) {
      setTranslations(translations);
    }
  }, [translations, setTranslations]);

  return <>{children}</>;
}
