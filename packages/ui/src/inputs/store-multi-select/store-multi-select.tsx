'use client';

import {
  Badge,
  CheckIcon,
  Combobox,
  Group,
  Loader,
  Pill,
  PillsInput,
  ScrollArea,
  Text,
  useCombobox,
} from '@mantine/core';
import { useMemo, useState } from 'react';

export interface StoreItem {
  id: string;
  name: string;
  businessModel: string;
  status: string;
}

export interface StoreMultiSelectProps {
  stores: StoreItem[];
  value: string[];
  onChange: (ids: string[]) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  isLoading?: boolean;
}

const MODEL_COLORS: Record<string, string> = {
  B2B: 'blue',
  B2C: 'green',
};

export function StoreMultiSelect({
  stores,
  value,
  onChange,
  label,
  placeholder,
  error,
  disabled,
  isLoading,
}: StoreMultiSelectProps) {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
    onDropdownOpen: () => combobox.updateSelectedOptionIndex('active'),
  });

  const [search, setSearch] = useState('');

  const activeStores = useMemo(
    () => stores.filter((s) => s.status === 'ACTIVE'),
    [stores]
  );

  const grouped = useMemo(() => {
    const groups: Record<string, StoreItem[]> = {};
    for (const store of activeStores) {
      const key = store.businessModel;
      if (!groups[key]) groups[key] = [];
      groups[key].push(store);
    }
    return groups;
  }, [activeStores]);

  const filteredGroups = useMemo(() => {
    const result: Record<string, StoreItem[]> = {};
    const term = search.toLowerCase().trim();
    for (const [key, items] of Object.entries(grouped)) {
      const filtered = term
        ? items.filter((s) => s.name.toLowerCase().includes(term))
        : items;
      if (filtered.length > 0) result[key] = filtered;
    }
    return result;
  }, [grouped, search]);

  const handleValueSelect = (storeId: string) => {
    if (value.includes(storeId)) {
      onChange(value.filter((id) => id !== storeId));
    } else {
      onChange([...value, storeId]);
    }
  };

  const handleValueRemove = (storeId: string) => {
    onChange(value.filter((id) => id !== storeId));
  };

  const pills = value.map((id) => {
    const store = activeStores.find((s) => s.id === id);
    if (!store) return null;
    const color = MODEL_COLORS[store.businessModel] ?? 'gray';
    return (
      <Pill
        key={id}
        withRemoveButton={!disabled}
        onRemove={() => handleValueRemove(id)}
        styles={{
          root: {
            backgroundColor: `var(--mantine-color-${color}-1)`,
            color: `var(--mantine-color-${color}-9)`,
          },
        }}
      >
        {store.name}
      </Pill>
    );
  });

  const options = Object.entries(filteredGroups).map(([model, items]) => (
    <Combobox.Group key={model} label={model}>
      {items.map((store) => {
        const isSelected = value.includes(store.id);
        const color = MODEL_COLORS[store.businessModel] ?? 'gray';
        return (
          <Combobox.Option
            key={store.id}
            value={store.id}
            active={isSelected}
          >
            <Group gap="sm" wrap="nowrap">
              {isSelected && <CheckIcon size={12} />}
              <Text size="sm" truncate>
                {store.name}
              </Text>
              <Badge size="xs" variant="light" color={color}>
                {store.businessModel}
              </Badge>
            </Group>
          </Combobox.Option>
        );
      })}
    </Combobox.Group>
  ));

  return (
    <Combobox
      store={combobox}
      onOptionSubmit={handleValueSelect}
      withinPortal={true}
    >
      <Combobox.DropdownTarget>
        <PillsInput
          label={label}
          error={error}
          disabled={disabled}
          pointer
          onClick={() => combobox.toggleDropdown()}
          rightSection={isLoading ? <Loader size={16} /> : <Combobox.Chevron />}
        >
          <Pill.Group>
            {pills.length > 0 ? (
              pills
            ) : (
              <PillsInput.Field
                placeholder={placeholder}
                value={search}
                onChange={(e) => {
                  setSearch(e.currentTarget.value);
                  combobox.openDropdown();
                  combobox.updateSelectedOptionIndex();
                }}
                onFocus={() => combobox.openDropdown()}
                onBlur={() => combobox.closeDropdown()}
                onKeyDown={(e) => {
                  if (e.key === 'Backspace' && search.length === 0) {
                    e.preventDefault();
                    const last = value[value.length - 1];
                    if (last) handleValueRemove(last);
                  }
                }}
              />
            )}
            {pills.length > 0 && (
              <PillsInput.Field
                placeholder=""
                value={search}
                onChange={(e) => {
                  setSearch(e.currentTarget.value);
                  combobox.openDropdown();
                  combobox.updateSelectedOptionIndex();
                }}
                onFocus={() => combobox.openDropdown()}
                onBlur={() => combobox.closeDropdown()}
                onKeyDown={(e) => {
                  if (e.key === 'Backspace' && search.length === 0) {
                    e.preventDefault();
                    const last = value[value.length - 1];
                    if (last) handleValueRemove(last);
                  }
                }}
              />
            )}
          </Pill.Group>
        </PillsInput>
      </Combobox.DropdownTarget>

      <Combobox.Dropdown>
        <Combobox.Options>
          <ScrollArea.Autosize mah={200} type="scroll">
            {options.length > 0 ? (
              options
            ) : (
              <Combobox.Empty>No stores found</Combobox.Empty>
            )}
          </ScrollArea.Autosize>
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}
