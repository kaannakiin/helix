import { Select, Button, Group, Stack } from "@mantine/core";
import { useDataTableTranslations } from "../context/DataTableTranslationContext";

interface EnumFilterModel {
  filterType: "custom";
  value: string;
}

interface EnumFilterProps {
  model: EnumFilterModel | null;
  onModelChange: (model: EnumFilterModel | null) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export function EnumFilter({
  model,
  onModelChange,
  options,
  placeholder,
}: EnumFilterProps) {
  const t = useDataTableTranslations();

  const value = model?.value || null;

  const handleChange = (newValue: string | null) => {
    if (newValue === null) {
      onModelChange(null);
    } else {
      onModelChange({
        filterType: "custom",
        value: newValue,
      });
    }
  };

  const handleReset = () => {
    onModelChange(null);
  };

  return (
    <Stack gap="xs" p="xs">
      <Select
        placeholder={placeholder ?? t.filters.text.placeholder}
        data={options}
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

EnumFilter.displayName = "EnumFilter";
