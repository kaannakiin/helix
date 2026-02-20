import { Button, Group, Select, Stack } from '@mantine/core';
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

  const value = model ? (model.filter ? 'true' : 'false') : null;

  const BOOLEAN_OPTIONS = [
    { value: 'true', label: t.filters.boolean.yes },
    { value: 'false', label: t.filters.boolean.no },
  ];

  const handleChange = (newValue: string | null) => {
    if (newValue === null) {
      onModelChange(null);
    } else {
      onModelChange({
        filterType: 'boolean',
        filter: newValue === 'true',
      });
    }
  };

  const handleReset = () => {
    onModelChange(null);
  };

  return (
    <Stack gap="xs" p="xs">
      <Select
        placeholder={t.filters.boolean.placeholder}
        data={BOOLEAN_OPTIONS}
        value={value}
        onChange={handleChange}
        size="xs"
        clearable
        comboboxProps={{ withinPortal: false }}
      />
      <Group gap="xs" grow>
        <Button size="xs" variant="subtle" onClick={handleReset}>
          {t.filters.reset}
        </Button>
      </Group>
    </Stack>
  );
}

BooleanFilter.displayName = 'BooleanFilter';
