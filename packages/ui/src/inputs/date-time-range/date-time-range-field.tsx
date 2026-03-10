'use client';

import { Stack } from '@mantine/core';
import { DateTimePicker, type DateTimeStringValue } from '@mantine/dates';
import {
  Controller,
  useFormContext,
  useWatch,
  type FieldValues,
  type Path,
} from 'react-hook-form';

export type DateTimeRangeMode = 'startOnly' | 'endOnly' | 'both';

export interface DateTimeRangeFieldProps<T extends FieldValues> {
  startName: Path<T>;
  endName: Path<T>;
  startLabel?: string;
  endLabel?: string;
  mode?: DateTimeRangeMode;
}

const toMantineDateTime = (
  iso: string | null | undefined
): DateTimeStringValue | null => {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const fromMantineDateTime = (
  val: DateTimeStringValue | null
): string | null => {
  if (!val) return null;
  return new Date(val).toISOString();
};

const toMantineDateString = (d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const DateTimeRangeField = <T extends FieldValues>({
  startName,
  endName,
  startLabel = 'Valid From',
  endLabel = 'Valid To',
  mode = 'both',
}: DateTimeRangeFieldProps<T>) => {
  const { control } = useFormContext<T>();
  const startValue = useWatch({ control, name: startName });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = startValue ? new Date(startValue as string) : null;
  const endMinDate = startDate && startDate > today ? startDate : today;

  return (
    <Stack gap="md">
      {(mode === 'both' || mode === 'startOnly') && (
        <Controller
          control={control}
          name={startName}
          render={({ field, fieldState }) => (
            <DateTimePicker
              value={toMantineDateTime(field.value as string)}
              onChange={(val) => field.onChange(fromMantineDateTime(val))}
              label={startLabel}
              error={fieldState.error?.message}
              minDate={toMantineDateString(today)}
              clearable
            />
          )}
        />
      )}
      {(mode === 'both' || mode === 'endOnly') && (
        <Controller
          control={control}
          name={endName}
          render={({ field, fieldState }) => (
            <DateTimePicker
              value={toMantineDateTime(field.value as string)}
              onChange={(val) => field.onChange(fromMantineDateTime(val))}
              label={endLabel}
              error={fieldState.error?.message}
              minDate={toMantineDateString(endMinDate)}
              clearable
            />
          )}
        />
      )}
    </Stack>
  );
};

export default DateTimeRangeField;
