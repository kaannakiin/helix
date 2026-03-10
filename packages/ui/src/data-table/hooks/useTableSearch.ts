'use client';

import type { SearchParam } from '@org/types/data-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

export interface UseTableSearchOptions<TData> {
  fields: Array<keyof TData & string>;
  searchParam?: string;
}

export function useTableSearch<TData>(options: UseTableSearchOptions<TData>): {
  search: string;
  setSearch: (value: string) => void;
  searchParam: SearchParam | undefined;
} {
  const { fields, searchParam: paramName = 'q' } = options;
  const searchParams = useSearchParams();
  const router = useRouter();
  const search = searchParams.get(paramName) ?? '';

  const fieldsKey = fields.join(',');

  const setSearch = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(paramName, value);
    } else {
      params.delete(paramName);
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const searchParam = useMemo<SearchParam | undefined>(
    () => (search ? { value: search, fields: fields as string[] } : undefined),

    [search, fieldsKey]
  );

  return { search, setSearch, searchParam };
}
