import { ActionIcon, Stack, TextInput } from '@mantine/core';
import { useDebouncedCallback } from '@mantine/hooks';
import { Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDataTableTranslations } from '../context/DataTableTranslationContext';

interface TextFilterModel {
  filterType: 'text';
  type: string;
  filter: string;
}

interface TextFilterProps {
  model: TextFilterModel | null;
  onModelChange: (model: TextFilterModel | null) => void;
  placeholder?: string;
}

export function TextFilter({ model, onModelChange, placeholder }: TextFilterProps) {
  const t = useDataTableTranslations();
  const filterType = model?.type || 'contains';

  const [localValue, setLocalValue] = useState(model?.filter || '');

  useEffect(() => {
    const modelValue = model?.filter || '';
    if (modelValue !== localValue) {
      setLocalValue(modelValue);
    }
  }, [model?.filter]);

  const debouncedOnModelChange = useDebouncedCallback((value: string) => {
    if (value === '') {
      onModelChange(null);
    } else {
      onModelChange({
        filterType: 'text',
        type: filterType,
        filter: value,
      });
    }
  }, 300);

  const handleTextChange = (value: string) => {
    setLocalValue(value);
    debouncedOnModelChange(value);
  };

  const handleReset = () => {
    setLocalValue('');
    onModelChange(null);
  };

  return (
    <Stack gap="xs" p="xs">
      <TextInput
        placeholder={placeholder ?? t.filters.text.placeholder}
        value={localValue}
        onChange={(e) => handleTextChange(e.currentTarget.value)}
        size="xs"
        leftSection={<Search size={14} />}
        rightSection={
          localValue ? (
            <ActionIcon size="xs" variant="subtle" onClick={handleReset}>
              <X size={12} />
            </ActionIcon>
          ) : null
        }
      />
    </Stack>
  );
}

TextFilter.displayName = 'TextFilter';
