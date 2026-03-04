import { Chip, Group, Stack } from '@mantine/core';
import { useDataTableTranslations } from '../context/DataTableTranslationContext';

interface LocaleFilterModel {
  filterType: 'custom';
  value: string;
}

interface LocaleFilterProps {
  model: LocaleFilterModel | null;
  onModelChange: (model: LocaleFilterModel | null) => void;
}

const FLAG_MAP: Record<string, string> = {
  EN: '\u{1F1EC}\u{1F1E7}',
  TR: '\u{1F1F9}\u{1F1F7}',
  DE: '\u{1F1E9}\u{1F1EA}',
  FR: '\u{1F1EB}\u{1F1F7}',
  ES: '\u{1F1EA}\u{1F1F8}',
  IT: '\u{1F1EE}\u{1F1F9}',
  NL: '\u{1F1F3}\u{1F1F1}',
};

export function LocaleFilter({ model, onModelChange }: LocaleFilterProps) {
  const t = useDataTableTranslations();

  const value = model?.value ?? '';

  const LOCALE_OPTIONS = [
    { value: 'EN', label: t.filters.locale.labels.en },
    { value: 'TR', label: t.filters.locale.labels.tr },
    { value: 'DE', label: t.filters.locale.labels.de },
    { value: 'FR', label: t.filters.locale.labels.fr },
    { value: 'ES', label: t.filters.locale.labels.es },
    { value: 'IT', label: t.filters.locale.labels.it },
    { value: 'NL', label: t.filters.locale.labels.nl },
  ];

  const handleChange = (newValue: string | string[]) => {
    const val = Array.isArray(newValue) ? newValue[0] : newValue;
    // Re-clicking the active chip deselects it
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
          {LOCALE_OPTIONS.map((opt) => (
            <Chip key={opt.value} value={opt.value} size="xs" variant="outline">
              {FLAG_MAP[opt.value] ?? ''} {opt.label}
            </Chip>
          ))}
        </Group>
      </Chip.Group>
    </Stack>
  );
}

LocaleFilter.displayName = 'LocaleFilter';
