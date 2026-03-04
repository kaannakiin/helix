import { useState, useEffect, useRef } from 'react';
import { Group, NumberInput, SegmentedControl, Stack } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { useDataTableTranslations } from '../context/DataTableTranslationContext';

interface NumberFilterModel {
  filterType: 'number';
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

  const [filterType, setFilterType] = useState(model?.type || 'equals');
  const [localValue, setLocalValue] = useState<number | string>(
    model?.filter ?? '',
  );
  const [localValueTo, setLocalValueTo] = useState<number | string>(
    model?.filterTo ?? '',
  );

  const [debouncedValue] = useDebouncedValue(localValue, 300);
  const [debouncedValueTo] = useDebouncedValue(localValueTo, 300);

  const isExternalUpdate = useRef(false);

  useEffect(() => {
    const modelValue = model?.filter ?? '';
    const modelValueTo = model?.filterTo ?? '';
    const modelType = model?.type || 'equals';

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

    if (debouncedValue === '' || debouncedValue === undefined) {
      onModelChangeRef.current(null);
      return;
    }

    const numValue = Number(debouncedValue);
    if (isNaN(numValue)) {
      onModelChangeRef.current(null);
      return;
    }

    const newModel: NumberFilterModel = {
      filterType: 'number',
      type: filterType,
      filter: numValue,
    };

    if (
      filterType === 'inRange' &&
      debouncedValueTo !== '' &&
      debouncedValueTo !== undefined
    ) {
      const numValueTo = Number(debouncedValueTo);
      if (!isNaN(numValueTo)) {
        newModel.filterTo = numValueTo;
      }
    }

    onModelChangeRef.current(newModel);
  }, [debouncedValue, debouncedValueTo, filterType]);

  const handleFilterTypeChange = (type: string) => {
    setFilterType(type);
  };

  const handleReset = () => {
    setLocalValue('');
    setLocalValueTo('');
    setFilterType('equals');
    onModelChange(null);
  };

  return (
    <Stack gap="xs" p="xs">
      <SegmentedControl
        fullWidth
        size="xs"
        value={filterType}
        onChange={handleFilterTypeChange}
        data={[
          { value: 'equals', label: '=' },
          { value: 'greaterThan', label: '>' },
          { value: 'lessThan', label: '<' },
          { value: 'inRange', label: '\u2194' },
        ]}
      />
      {filterType === 'inRange' ? (
        <Group gap="xs" grow>
          <NumberInput
            placeholder={t.filters.number?.placeholder ?? 'Value...'}
            value={localValue}
            onChange={setLocalValue}
            size="xs"
          />
          <NumberInput
            placeholder={t.filters.number?.placeholderTo ?? 'To...'}
            value={localValueTo}
            onChange={setLocalValueTo}
            size="xs"
          />
        </Group>
      ) : (
        <NumberInput
          placeholder={t.filters.number?.placeholder ?? 'Value...'}
          value={localValue}
          onChange={setLocalValue}
          size="xs"
        />
      )}
    </Stack>
  );
}

NumberFilter.displayName = 'NumberFilter';
