import { SegmentedControl, Stack } from '@mantine/core';
import { useDataTableTranslations } from '../context/DataTableTranslationContext';

interface BooleanFilterModel {
  filterType: 'boolean';
  filter: boolean;
}

interface BooleanFilterProps {
  model: BooleanFilterModel | null;
  onModelChange: (model: BooleanFilterModel | null) => void;
}

export function BooleanFilter({ model, onModelChange }: BooleanFilterProps) {
  const t = useDataTableTranslations();

  const value = model ? (model.filter ? 'true' : 'false') : '';

  const handleChange = (newValue: string) => {
    if (newValue === '') {
      onModelChange(null);
    } else {
      onModelChange({
        filterType: 'boolean',
        filter: newValue === 'true',
      });
    }
  };

  return (
    <Stack gap="xs" p="xs">
      <SegmentedControl
        fullWidth
        size="xs"
        value={value}
        onChange={handleChange}
        data={[
          { value: '', label: t.filters.reset },
          { value: 'true', label: t.filters.boolean.yes },
          { value: 'false', label: t.filters.boolean.no },
        ]}
      />
    </Stack>
  );
}

BooleanFilter.displayName = 'BooleanFilter';
