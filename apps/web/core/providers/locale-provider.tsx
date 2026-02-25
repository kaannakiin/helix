'use client';

import { DatesProvider, type DayOfWeek } from '@mantine/dates';
import { DateTransformer } from '@org/utils/date-transformer';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';
import { useLocale } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  const safeLoc = useMemo(
    () => DateTransformer.getSafeLocale(locale),
    [locale]
  );
  const [isLoaded, setIsLoaded] = useState(safeLoc === 'tr');

  useEffect(() => {
    let mounted = true;
    if (safeLoc === 'tr') {
      dayjs.locale('tr');
      setIsLoaded(true);
      return;
    }

    import(`dayjs/locale/${safeLoc}.js`)
      .then(() => {
        if (mounted) {
          dayjs.locale(safeLoc);
          setIsLoaded(true);
        }
      })
      .catch((e) => {
        console.warn(
          `Day.js locale file for "${safeLoc}" could not be loaded.`,
          e
        );
        if (mounted) setIsLoaded(true);
      });

    return () => {
      mounted = false;
    };
  }, [safeLoc]);

  const currentLocale = isLoaded ? safeLoc : 'tr';
  const firstDayOfWeek: DayOfWeek = currentLocale === 'en' ? 0 : 1;
  const weekendDays: DayOfWeek[] = [0, 6];

  return (
    <DatesProvider
      settings={{
        locale: currentLocale,
        firstDayOfWeek,
        weekendDays,
      }}
    >
      {children}
    </DatesProvider>
  );
}
