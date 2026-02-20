import { useState, useEffect, useRef } from "react";
import { Button, Group, Stack, Select } from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { useDebouncedValue } from "@mantine/hooks";
import { useDataTableTranslations } from "../context/DataTableTranslationContext";

interface DateFilterModel {
  filterType: "date";
  type: string;
  dateFrom: string;
  dateTo?: string;
}

interface DateFilterProps {
  model: DateFilterModel | null;
  onModelChange: (model: DateFilterModel | null) => void;
}

export function DateFilter({ model, onModelChange }: DateFilterProps) {
  const t = useDataTableTranslations();

  const onModelChangeRef = useRef(onModelChange);
  onModelChangeRef.current = onModelChange;

  const [filterType, setFilterType] = useState(model?.type || "equals");
  const [localDateFrom, setLocalDateFrom] = useState<Date | null>(
    model?.dateFrom ? new Date(model.dateFrom) : null,
  );
  const [localDateTo, setLocalDateTo] = useState<Date | null>(
    model?.dateTo ? new Date(model.dateTo) : null,
  );

  const [debouncedDateFrom] = useDebouncedValue(localDateFrom, 300);
  const [debouncedDateTo] = useDebouncedValue(localDateTo, 300);

  const isExternalUpdate = useRef(false);

  const FILTER_TYPES = [
    { value: "equals", label: t.filters.date.equals },
    { value: "greaterThan", label: t.filters.date.greaterThan },
    { value: "lessThan", label: t.filters.date.lessThan },
    { value: "inRange", label: t.filters.date.inRange },
  ];

  useEffect(() => {
    const modelDateFrom = model?.dateFrom ? new Date(model.dateFrom) : null;
    const modelDateTo = model?.dateTo ? new Date(model.dateTo) : null;
    const modelType = model?.type || "equals";

    const dateFromChanged =
      modelDateFrom?.getTime() !== localDateFrom?.getTime();
    const dateToChanged = modelDateTo?.getTime() !== localDateTo?.getTime();
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

    const newModel: DateFilterModel = {
      filterType: "date",
      type: filterType,
      dateFrom: debouncedDateFrom.toISOString(),
    };

    if (filterType === "inRange" && debouncedDateTo) {
      newModel.dateTo = debouncedDateTo.toISOString();
    }

    onModelChangeRef.current(newModel);
  }, [debouncedDateFrom, debouncedDateTo, filterType]);

  const handleFilterTypeChange = (type: string | null) => {
    if (!type) return;
    setFilterType(type);
  };

  const handleDateFromChange = (value: string | null) => {
    setLocalDateFrom(value ? new Date(value) : null);
  };

  const handleDateToChange = (value: string | null) => {
    setLocalDateTo(value ? new Date(value) : null);
  };

  const handleReset = () => {
    setLocalDateFrom(null);
    setLocalDateTo(null);
    setFilterType("equals");
    onModelChange(null);
  };

  return (
    <Stack gap="xs" p="xs">
      <Select
        data={FILTER_TYPES}
        value={filterType}
        onChange={handleFilterTypeChange}
        size="xs"
        comboboxProps={{ withinPortal: false }}
      />
      <DateTimePicker
        placeholder={t.filters.date.placeholder}
        value={localDateFrom}
        onChange={handleDateFromChange}
        size="xs"
        clearable
        popoverProps={{ withinPortal: false }}
      />
      {filterType === "inRange" && (
        <DateTimePicker
          placeholder={t.filters.date.placeholderTo}
          value={localDateTo}
          onChange={handleDateToChange}
          size="xs"
          clearable
          popoverProps={{ withinPortal: false }}
        />
      )}
      <Group gap="xs" grow>
        <Button size="xs" variant="subtle" onClick={handleReset}>
          {t.filters.reset}
        </Button>
      </Group>
    </Stack>
  );
}

DateFilter.displayName = "DateFilter";
