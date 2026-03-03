'use client';

import { Group, Input, Select, Stack, Text, TextInput } from '@mantine/core';
import cronstrue from 'cronstrue';
import 'cronstrue/locales/tr';
import { useCallback, useMemo } from 'react';

export interface CronPreset {
  value: string;
  label: { en: string; tr: string };
}

export interface CronInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  locale?: string;
  presets?: CronPreset[];
}

type CronFieldKey = 'minute' | 'hour' | 'dom' | 'month' | 'dow';

const CRON_FIELDS: readonly {
  key: CronFieldKey;
  label: { en: string; tr: string };
  placeholder: string;
}[] = [
  { key: 'minute', label: { en: 'Minute', tr: 'Dakika' }, placeholder: '*' },
  { key: 'hour', label: { en: 'Hour', tr: 'Saat' }, placeholder: '*' },
  { key: 'dom', label: { en: 'Day (M)', tr: 'Gün (A)' }, placeholder: '*' },
  { key: 'month', label: { en: 'Month', tr: 'Ay' }, placeholder: '*' },
  { key: 'dow', label: { en: 'Day (W)', tr: 'Gün (H)' }, placeholder: '*' },
];

const DEFAULT_PRESETS: CronPreset[] = [
  { value: '* * * * *', label: { en: 'Every minute', tr: 'Her dakika' } },
  { value: '*/15 * * * *', label: { en: 'Every 15 minutes', tr: 'Her 15 dakika' } },
  { value: '0 * * * *', label: { en: 'Every hour', tr: 'Her saat' } },
  { value: '0 */6 * * *', label: { en: 'Every 6 hours', tr: 'Her 6 saat' } },
  { value: '0 */12 * * *', label: { en: 'Every 12 hours', tr: 'Her 12 saat' } },
  { value: '0 0 * * *', label: { en: 'Every day at midnight', tr: 'Her gün gece yarısı' } },
  { value: '0 9 * * *', label: { en: 'Every day at 09:00', tr: 'Her gün 09:00\'da' } },
  { value: '0 9 * * 1-5', label: { en: 'Weekdays at 09:00', tr: 'Hafta içi 09:00\'da' } },
  { value: '0 0 * * 1', label: { en: 'Every Monday at midnight', tr: 'Her Pazartesi gece yarısı' } },
  { value: '0 0 1 * *', label: { en: 'First day of month at midnight', tr: 'Ayın 1\'i gece yarısı' } },
];

function parseCronFields(value: string | undefined): Record<CronFieldKey, string> {
  const parts = (value ?? '* * * * *').split(/\s+/);
  return {
    minute: parts[0] ?? '*',
    hour: parts[1] ?? '*',
    dom: parts[2] ?? '*',
    month: parts[3] ?? '*',
    dow: parts[4] ?? '*',
  };
}

export function CronInput({
  value,
  onChange,
  onBlur,
  label,
  description,
  error,
  required,
  disabled,
  size,
  locale = 'en',
  presets,
}: CronInputProps) {
  const fields = useMemo(() => parseCronFields(value), [value]);
  const lang = locale === 'tr' ? 'tr' : 'en';
  const activePresets = presets ?? DEFAULT_PRESETS;

  const handleFieldChange = useCallback(
    (field: CronFieldKey, newVal: string) => {
      const next = { ...fields, [field]: newVal };
      onChange?.(
        `${next.minute} ${next.hour} ${next.dom} ${next.month} ${next.dow}`
      );
    },
    [fields, onChange]
  );

  const humanDescription = useMemo(() => {
    const expr = value?.trim();
    if (!expr) return null;
    try {
      return cronstrue.toString(expr, {
        locale: lang,
        use24HourTimeFormat: true,
        throwExceptionOnParseError: true,
      });
    } catch {
      return null;
    }
  }, [value, lang]);

  const selectData = useMemo(
    () => activePresets.map((p) => ({ value: p.value, label: p.label[lang] })),
    [activePresets, lang]
  );

  const selectedPreset = useMemo(
    () => activePresets.find((p) => p.value === value?.trim())?.value ?? null,
    [activePresets, value]
  );

  return (
    <Input.Wrapper
      label={label}
      description={description}
      error={error}
      required={required}
      size={size}
    >
      <Stack gap="xs" mt={4}>
        <Select
          data={selectData}
          value={selectedPreset}
          onChange={(val) => val && onChange?.(val)}
          placeholder={lang === 'tr' ? 'Hazır şablon seç...' : 'Select a preset...'}
          disabled={disabled}
          size={size}
          clearable={false}
          allowDeselect={false}
        />

        <Group gap="xs" wrap="nowrap" grow>
          {CRON_FIELDS.map(({ key, label: fieldLabel, placeholder }) => (
            <Stack key={key} gap={2}>
              <Text size="xs" c="dimmed" ta="center">
                {fieldLabel[lang]}
              </Text>
              <TextInput
                value={fields[key]}
                onChange={(e) => handleFieldChange(key, e.currentTarget.value)}
                onBlur={onBlur}
                placeholder={placeholder}
                disabled={disabled}
                size={size}
                error={!!error}
                styles={{
                  input: {
                    textAlign: 'center',
                    fontFamily: 'monospace',
                  },
                }}
              />
            </Stack>
          ))}
        </Group>

        {humanDescription && !error && (
          <Text size="xs" c="dimmed" fs="italic">
            {humanDescription}
          </Text>
        )}
      </Stack>
    </Input.Wrapper>
  );
}
