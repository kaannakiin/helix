import { Select, Button, Group, Stack } from "@mantine/core";
import { useDataTableTranslations } from "../context/DataTableTranslationContext";

interface LocaleFilterModel {
  filterType: "custom";
  value: string;
}

interface LocaleFilterProps {
  model: LocaleFilterModel | null;
  onModelChange: (model: LocaleFilterModel | null) => void;
}

export function LocaleFilter({ model, onModelChange }: LocaleFilterProps) {
  const t = useDataTableTranslations();

  const value = model?.value || null;

  const LOCALE_OPTIONS = [
    { value: "EN", label: t.filters.locale.labels.en },
    { value: "TR", label: t.filters.locale.labels.tr },
    { value: "DE", label: t.filters.locale.labels.de },
    { value: "FR", label: t.filters.locale.labels.fr },
    { value: "ES", label: t.filters.locale.labels.es },
    { value: "IT", label: t.filters.locale.labels.it },
    { value: "NL", label: t.filters.locale.labels.nl },
  ];

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
        placeholder={t.filters.locale.placeholder}
        data={LOCALE_OPTIONS}
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

LocaleFilter.displayName = "LocaleFilter";
