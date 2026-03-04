import { Group, SegmentedControl, Stack } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useDebouncedValue } from '@mantine/hooks';
import { useEffect, useRef, useState } from 'react';
import { useDataTableTranslations } from '../context/DataTableTranslationContext';

interface DateFilterModel {
  filterType: 'date';
  type: string;
  dateFrom: string;
  dateTo?: string;
}

interface DateFilterProps {
  model: DateFilterModel | null;
  onModelChange: (model: DateFilterModel | null) => void;
}

function toDateString(iso: string | undefined | null): string | null {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    return d.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

function toISO(dateStr: string | null): string | null {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toISOString();
  } catch {
    return null;
  }
}

export function DateFilter({ model, onModelChange }: DateFilterProps) {
  const t = useDataTableTranslations();

  const onModelChangeRef = useRef(onModelChange);
  onModelChangeRef.current = onModelChange;

  const [filterType, setFilterType] = useState(model?.type || 'equals');
  const [localDateFrom, setLocalDateFrom] = useState<string | null>(
    toDateString(model?.dateFrom)
  );
  const [localDateTo, setLocalDateTo] = useState<string | null>(
    toDateString(model?.dateTo)
  );

  const [debouncedDateFrom] = useDebouncedValue(localDateFrom, 300);
  const [debouncedDateTo] = useDebouncedValue(localDateTo, 300);

  const isExternalUpdate = useRef(false);

  useEffect(() => {
    const modelDateFrom = toDateString(model?.dateFrom);
    const modelDateTo = toDateString(model?.dateTo);
    const modelType = model?.type || 'equals';

    const dateFromChanged = modelDateFrom !== localDateFrom;
    const dateToChanged = modelDateTo !== localDateTo;
    const typeChanged = modelType !== filterType;

    if (dateFromChanged || dateToChanged || typeChanged) {
      isExternalUpdate.current = true;
      if (dateFromChanged) setLocalDateFrom(modelDateFrom);
      if (dateToChanged) setLocalDateTo(modelDateTo);
      if (typeChanged) setFilterType(modelType);
    }
  }, [model?.dateFrom, model?.dateTo, model?.type]);

  useEffect(() => {
    if (isExternalUpdate.current) {
      isExternalUpdate.current = false;
      return;
    }

    if (!debouncedDateFrom) {
      onModelChangeRef.current(null);
      return;
    }

    const isoFrom = toISO(debouncedDateFrom);
    if (!isoFrom) {
      onModelChangeRef.current(null);
      return;
    }

    const newModel: DateFilterModel = {
      filterType: 'date',
      type: filterType,
      dateFrom: isoFrom,
    };

    if (filterType === 'inRange' && debouncedDateTo) {
      const isoTo = toISO(debouncedDateTo);
      if (isoTo) {
        newModel.dateTo = isoTo;
      }
    }

    onModelChangeRef.current(newModel);
  }, [debouncedDateFrom, debouncedDateTo, filterType]);

  const handleFilterTypeChange = (type: string) => {
    setFilterType(type);
  };

  const handleDateFromChange = (value: string | null) => {
    setLocalDateFrom(value);
  };

  const handleDateToChange = (value: string | null) => {
    setLocalDateTo(value);
  };

  return (
    <Stack gap="xs" p="xs">
      <SegmentedControl
        fullWidth
        size="xs"
        value={filterType}
        onChange={handleFilterTypeChange}
        data={[
          { value: 'equals', label: t.filters.date.equals },
          { value: 'greaterThan', label: t.filters.date.greaterThan },
          { value: 'lessThan', label: t.filters.date.lessThan },
          { value: 'inRange', label: t.filters.date.inRange },
        ]}
      />
      {filterType === 'inRange' ? (
        <Group gap="xs" grow>
          <DatePickerInput
            placeholder={t.filters.date.placeholder}
            value={localDateFrom}
            onChange={handleDateFromChange}
            size="xs"
            clearable
            popoverProps={{ withinPortal: false }}
          />
          <DatePickerInput
            placeholder={t.filters.date.placeholderTo}
            value={localDateTo}
            onChange={handleDateToChange}
            size="xs"
            clearable
            popoverProps={{ withinPortal: false }}
          />
        </Group>
      ) : (
        <DatePickerInput
          placeholder={t.filters.date.placeholder}
          value={localDateFrom}
          onChange={handleDateFromChange}
          size="xs"
          clearable
          popoverProps={{ withinPortal: false }}
        />
      )}
    </Stack>
  );
}

DateFilter.displayName = 'DateFilter';
