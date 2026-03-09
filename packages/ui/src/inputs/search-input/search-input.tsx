'use client';

import { ActionIcon, TextInput, type TextInputProps } from '@mantine/core';
import { useDebouncedCallback } from '@mantine/hooks';
import { Search, X } from 'lucide-react';
import { useState } from 'react';

export interface SearchInputProps extends Omit<TextInputProps, 'onChange'> {
  debounceMs?: number;
  value?: string;
  onChange?: (value: string) => void;
}

export function SearchInput({
  debounceMs = 300,
  value: externalValue = '',
  onChange,
  ...props
}: SearchInputProps) {
  const [prevExternal, setPrevExternal] = useState(externalValue);
  const [local, setLocal] = useState(externalValue);

  if (externalValue !== prevExternal) {
    setPrevExternal(externalValue);
    setLocal(externalValue);
  }

  const debouncedOnChange = useDebouncedCallback((v: string) => {
    onChange?.(v);
  }, debounceMs);

  const handleChange = (v: string) => {
    setLocal(v);
    debouncedOnChange(v);
  };

  const handleClear = () => {
    setLocal('');
    debouncedOnChange.flush();
    onChange?.('');
  };

  return (
    <TextInput
      value={local}
      onChange={(e) => handleChange(e.currentTarget.value)}
      leftSection={<Search size={14} />}
      rightSection={
        local ? (
          <ActionIcon size="xs" variant="subtle" onClick={handleClear}>
            <X size={12} />
          </ActionIcon>
        ) : null
      }
      {...props}
    />
  );
}
