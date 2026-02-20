'use client';

import {
  Combobox,
  Group,
  InputBase,
  ScrollArea,
  Text,
  useCombobox,
  type __InputStylesNames,
} from '@mantine/core';
import {
  createPhoneFormatter,
  getCountryPhoneData,
  getMaxNationalNumberLength,
  parsePhoneNumber,
  type CountryPhoneData,
  type RegionCode,
} from '@org/schemas/common';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from 'react';

interface PhoneInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  defaultRegion?: RegionCode;
  error?: string;
  label?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  rightSection?: React.ReactNode;
  styles?: Partial<Record<__InputStylesNames, CSSProperties>>;
  classNames?: Partial<Record<__InputStylesNames, string>>;
}

const PhoneInput = ({
  value,
  onChange,
  onBlur,
  defaultRegion = 'TR',
  error,
  label,
  description,
  required = false,
  disabled = false,
  size = 'md',
  rightSection,
  styles,
  classNames,
}: PhoneInputProps) => {
  const [selectedRegion, setSelectedRegion] =
    useState<RegionCode>(defaultRegion);
  const [search, setSearch] = useState('');

  const combobox = useCombobox({
    onDropdownClose: () => {
      combobox.resetSelectedOption();
      setSearch('');
    },
  });

  const countries = useMemo(() => getCountryPhoneData(), []);

  const formatter = useMemo(
    () => createPhoneFormatter(selectedRegion),
    [selectedRegion]
  );

  const selectedCountry = useMemo(
    () => countries.find((c) => c.region === selectedRegion),
    [countries, selectedRegion]
  );

  const maxLength = useMemo(
    () => getMaxNationalNumberLength(selectedRegion),
    [selectedRegion]
  );

  const filteredCountries = useMemo(() => {
    if (!search) return countries;
    const q = search.toLowerCase();
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.region.toLowerCase().includes(q) ||
        `+${c.code}`.includes(q)
    );
  }, [countries, search]);

  const parsedValue = useMemo(() => {
    if (!value) return null;
    return parsePhoneNumber(value, defaultRegion);
  }, [value, defaultRegion]);

  const displayValue = useMemo(() => {
    if (!value) return '';

    if (parsedValue?.nationalNumber) {
      return formatter.format(parsedValue.nationalNumber);
    }

    const phoneWithoutPlus = value.startsWith('+') ? value.substring(1) : value;
    const countryCode = selectedCountry?.code.toString() || '';

    if (phoneWithoutPlus.startsWith(countryCode)) {
      const nationalDigits = phoneWithoutPlus.substring(countryCode.length);
      return nationalDigits ? formatter.format(nationalDigits) : '';
    }

    return '';
  }, [value, parsedValue, formatter, selectedCountry]);

  useEffect(() => {
    if (parsedValue?.region && parsedValue.region !== selectedRegion) {
      setSelectedRegion(parsedValue.region);
    }
  }, [parsedValue, selectedRegion]);

  const handlePhoneChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const text = event.target.value;
      const digits = text.replace(/\D/g, '');

      if (digits.length > maxLength) {
        return;
      }

      if (digits) {
        const e164 = `+${selectedCountry?.code}${digits}`;
        onChange?.(e164);
      } else {
        onChange?.('');
      }
    },
    [selectedCountry?.code, onChange, maxLength]
  );

  const handleCountrySelect = useCallback(
    (country: CountryPhoneData) => {
      setSelectedRegion(country.region);
      onChange?.('');
      combobox.closeDropdown();
      setSearch('');
    },
    [onChange, combobox]
  );

  const countryButton = (
    <Group
      gap="xs"
      style={{ cursor: disabled ? 'default' : 'pointer' }}
      onClick={() => !disabled && combobox.toggleDropdown()}
      pr="xs"
    >
      <Text size="xl">{selectedCountry?.flag}</Text>
      <Text size="sm" fw={500}>
        +{selectedCountry?.code}
      </Text>
    </Group>
  );

  return (
    <div style={{ position: 'relative' }}>
      <InputBase
        value={displayValue}
        onChange={handlePhoneChange}
        onBlur={onBlur}
        label={label}
        description={description}
        error={error}
        required={required}
        disabled={disabled}
        size={size}
        leftSection={countryButton}
        leftSectionWidth={110}
        rightSection={rightSection}
        type="tel"
        styles={styles}
        classNames={classNames}
      />

      <Combobox
        store={combobox}
        onOptionSubmit={(val) => {
          const country = countries.find((c) => c.region === val);
          if (country) {
            handleCountrySelect(country);
          }
        }}
        withinPortal
      >
        <Combobox.Target>
          <div />
        </Combobox.Target>

        <Combobox.Dropdown>
          <Combobox.Search
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
            placeholder="Search countries..."
          />
          <Combobox.Options>
            <ScrollArea.Autosize mah={300} type="scroll">
              {filteredCountries.length > 0 ? (
                filteredCountries.map((country) => (
                  <Combobox.Option key={country.region} value={country.region}>
                    <Group gap="sm">
                      <Text size="xl">{country.flag}</Text>
                      <Text style={{ flex: 1 }}>{country.name}</Text>
                      <Text c="dimmed" size="sm">
                        +{country.code}
                      </Text>
                    </Group>
                  </Combobox.Option>
                ))
              ) : (
                <Combobox.Empty>No countries found</Combobox.Empty>
              )}
            </ScrollArea.Autosize>
          </Combobox.Options>
        </Combobox.Dropdown>
      </Combobox>
    </div>
  );
};

export { PhoneInput };
