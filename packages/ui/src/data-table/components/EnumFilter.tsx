import { Chip, Group, Stack } from '@mantine/core';
import { useDataTableTranslations } from '../context/DataTableTranslationContext';

interface EnumFilterModel {
  filterType: 'custom';
  value: string;
}

interface EnumFilterProps {
  model: EnumFilterModel | null;
  onModelChange: (model: EnumFilterModel | null) => void;
  options: Array<{ value: string; label: string }>;
}

export function EnumFilter({ model, onModelChange, options }: EnumFilterProps) {
  const t = useDataTableTranslations();

  const value = model?.value ?? '';

  const handleChange = (newValue: string | string[]) => {
    const val = Array.isArray(newValue) ? newValue[0] : newValue;
    if (!val || val === value) {
      onModelChange(null);
    } else {
      onModelChange({
        filterType: 'custom',
        value: val,
      });
    }
  };

  return (
    <Stack gap="xs" p="xs">
      <Chip.Group value={value} onChange={handleChange}>
        <Group gap="xs" wrap="wrap">
          {options.map((opt) => (
            <Chip key={opt.value} value={opt.value} size="xs" variant="outline">
              {opt.label}
            </Chip>
          ))}
        </Group>
      </Chip.Group>
    </Stack>
  );
}

EnumFilter.displayName = 'EnumFilter';
