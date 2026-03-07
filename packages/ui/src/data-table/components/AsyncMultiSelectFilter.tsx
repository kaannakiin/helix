'use client';

import { Loader, MultiSelect } from '@mantine/core';
import { useEffect, useRef, useState } from 'react';

export interface AsyncMultiSelectFilterModel {
  filterType: 'custom';
  values: string[];
}

interface AsyncMultiSelectFilterProps {
  model: AsyncMultiSelectFilterModel | null;
  onModelChange: (model: AsyncMultiSelectFilterModel | null) => void;
  fetchOptions: () => Promise<Array<{ value: string; label: string }>>;
  placeholder?: string;
}

export function AsyncMultiSelectFilter({
  model,
  onModelChange,
  fetchOptions,
  placeholder,
}: AsyncMultiSelectFilterProps) {
  const [options, setOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);
    fetchOptions()
      .then(setOptions)
      .finally(() => setLoading(false));
  }, [fetchOptions]);

  const handleChange = (values: string[]) => {
    if (values.length === 0) {
      onModelChange(null);
    } else {
      onModelChange({ filterType: 'custom', values });
    }
  };

  return (
    <MultiSelect
      data={options}
      value={model?.values ?? []}
      onChange={handleChange}
      placeholder={placeholder}
      rightSection={loading ? <Loader size={14} /> : undefined}
      searchable
      size="xs"
      px="xs"
      pb="xs"
    />
  );
}

AsyncMultiSelectFilter.displayName = 'AsyncMultiSelectFilter';
