import { useState, useEffect, useRef } from "react";
import { Button, Group, NumberInput, Select, Stack } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { useDataTableTranslations } from "../context/DataTableTranslationContext";

interface NumberFilterModel {
  filterType: "number";
  type: string;
  filter: number;
  filterTo?: number;
}

interface NumberFilterProps {
  model: NumberFilterModel | null;
  onModelChange: (model: NumberFilterModel | null) => void;
}

export function NumberFilter({ model, onModelChange }: NumberFilterProps) {
  const t = useDataTableTranslations();

  const onModelChangeRef = useRef(onModelChange);
  onModelChangeRef.current = onModelChange;

  const [filterType, setFilterType] = useState(model?.type || "equals");
  const [localValue, setLocalValue] = useState<number | string>(
    model?.filter ?? "",
  );
  const [localValueTo, setLocalValueTo] = useState<number | string>(
    model?.filterTo ?? "",
  );

  const [debouncedValue] = useDebouncedValue(localValue, 300);
  const [debouncedValueTo] = useDebouncedValue(localValueTo, 300);

  const isExternalUpdate = useRef(false);

  const FILTER_TYPES = [
    { value: "equals", label: t.filters.number?.equals ?? "Equals" },
    {
      value: "greaterThan",
      label: t.filters.number?.greaterThan ?? "Greater than",
    },
    { value: "lessThan", label: t.filters.number?.lessThan ?? "Less than" },
    { value: "inRange", label: t.filters.number?.inRange ?? "Between" },
  ];

  useEffect(() => {
    const modelValue = model?.filter ?? "";
    const modelValueTo = model?.filterTo ?? "";
    const modelType = model?.type || "equals";

    const valueChanged = modelValue !== localValue;
    const valueToChanged = modelValueTo !== localValueTo;
    const typeChanged = modelType !== filterType;

    if (valueChanged || valueToChanged || typeChanged) {
      isExternalUpdate.current = true;
      if (valueChanged) setLocalValue(modelValue);
      if (valueToChanged) setLocalValueTo(modelValueTo);
      if (typeChanged) setFilterType(modelType);
    }
  }, [model?.filter, model?.filterTo, model?.type]);

  useEffect(() => {
    if (isExternalUpdate.current) {
      isExternalUpdate.current = false;
      return;
    }

    if (debouncedValue === "" || debouncedValue === undefined) {
      onModelChangeRef.current(null);
      return;
    }

    const numValue = Number(debouncedValue);
    if (isNaN(numValue)) {
      onModelChangeRef.current(null);
      return;
    }

    const newModel: NumberFilterModel = {
      filterType: "number",
      type: filterType,
      filter: numValue,
    };

    if (
      filterType === "inRange" &&
      debouncedValueTo !== "" &&
      debouncedValueTo !== undefined
    ) {
      const numValueTo = Number(debouncedValueTo);
      if (!isNaN(numValueTo)) {
        newModel.filterTo = numValueTo;
      }
    }

    onModelChangeRef.current(newModel);
  }, [debouncedValue, debouncedValueTo, filterType]);

  const handleFilterTypeChange = (type: string | null) => {
    if (!type) return;
    setFilterType(type);
  };

  const handleReset = () => {
    setLocalValue("");
    setLocalValueTo("");
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
      <NumberInput
        placeholder={t.filters.number?.placeholder ?? "Value..."}
        value={localValue}
        onChange={setLocalValue}
        size="xs"
      />
      {filterType === "inRange" && (
        <NumberInput
          placeholder={t.filters.number?.placeholderTo ?? "To..."}
          value={localValueTo}
          onChange={setLocalValueTo}
          size="xs"
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

NumberFilter.displayName = "NumberFilter";
