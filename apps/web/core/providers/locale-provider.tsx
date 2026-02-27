'use client';

import { DatesProvider, type DayOfWeek } from '@mantine/dates';
import { Locale } from '@org/prisma/browser';
import { DateTransformer } from '@org/utils/date-transformer';
import { useMemo } from 'react';

export function LocaleProvider({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: Locale;
}) {
  const safeLoc = useMemo(
    () => DateTransformer.getSafeLocale(locale?.toLowerCase() ?? 'tr'),
    [locale]
  );

  const firstDayOfWeek: DayOfWeek = safeLoc === 'en' ? 0 : 1;
  const weekendDays: DayOfWeek[] = [0, 6];

  return (
    <DatesProvider
      settings={{
        locale: safeLoc,
        firstDayOfWeek,
        weekendDays,
      }}
    >
      {children}
    </DatesProvider>
  );
}
