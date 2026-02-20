import libphonenumber, { type RegionCode } from 'google-libphonenumber';
const { AsYouTypeFormatter, PhoneNumberFormat, PhoneNumberUtil } =
  libphonenumber;

export type { RegionCode };

export const phoneUtil = PhoneNumberUtil.getInstance();

export const getRegionFlag = (region: string): string => {
  const codePoints = region
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

export interface CountryPhoneData {
  region: RegionCode;
  code: number;
  flag: string;
  name: string;
  exampleNumber: string;
}

const getRegionName = (region: string): string => {
  try {
    const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
    return regionNames.of(region) || region;
  } catch {
    return region;
  }
};

export const getCountryPhoneData = (): CountryPhoneData[] => {
  return phoneUtil
    .getSupportedRegions()
    .map((region) => {
      const code = phoneUtil.getCountryCodeForRegion(region);
      const example = phoneUtil.getExampleNumber(region);
      const exampleFormatted = example
        ? phoneUtil.format(example, PhoneNumberFormat.NATIONAL)
        : '';

      return {
        region,
        code,
        flag: getRegionFlag(region),
        name: getRegionName(region),
        exampleNumber: exampleFormatted,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
};

export const getCountryCodeForRegion = (region: string): number => {
  return phoneUtil.getCountryCodeForRegion(region);
};

export const formatPhoneNumber = (
  phone: string,
  format: 'INTERNATIONAL' | 'NATIONAL' | 'E164' = 'INTERNATIONAL'
): string | null => {
  try {
    const parsed = phoneUtil.parse(phone);
    const formatMap = {
      INTERNATIONAL: PhoneNumberFormat.INTERNATIONAL,
      NATIONAL: PhoneNumberFormat.NATIONAL,
      E164: PhoneNumberFormat.E164,
    };
    return phoneUtil.format(parsed, formatMap[format]);
  } catch {
    return null;
  }
};

export const validatePhoneNumber = (
  phone: string,
  region?: string
): boolean => {
  try {
    const parsed = phoneUtil.parse(phone, region);
    return phoneUtil.isValidNumber(parsed);
  } catch {
    return false;
  }
};

export interface ParsedPhoneNumber {
  isValid: boolean;
  countryCode: number | null;
  nationalNumber: string | null;
  formattedInternational: string | null;
  formattedNational: string | null;
  region: RegionCode | null;
}

export const parsePhoneNumber = (
  phone: string,
  defaultRegion?: string
): ParsedPhoneNumber => {
  try {
    const parsed = phoneUtil.parse(phone, defaultRegion);
    const isValid = phoneUtil.isValidNumber(parsed);

    return {
      isValid,
      countryCode: parsed.getCountryCode() ?? null,
      nationalNumber: parsed.getNationalNumber()?.toString() ?? null,
      formattedInternational: phoneUtil.format(
        parsed,
        PhoneNumberFormat.INTERNATIONAL
      ),
      formattedNational: phoneUtil.format(parsed, PhoneNumberFormat.NATIONAL),
      region: phoneUtil.getRegionCodeForNumber(parsed) ?? null,
    };
  } catch {
    return {
      isValid: false,
      countryCode: null,
      nationalNumber: null,
      formattedInternational: null,
      formattedNational: null,
      region: null,
    };
  }
};

export const createPhoneFormatter = (region: string) => {
  const formatter = new AsYouTypeFormatter(region);

  return {
    inputDigit: (digit: string) => formatter.inputDigit(digit),
    clear: () => formatter.clear(),
    format: (phone: string): string => {
      formatter.clear();
      let result = '';
      for (const char of phone.replace(/\D/g, '')) {
        result = formatter.inputDigit(char);
      }
      return result;
    },
  };
};

export const getPhoneNumberCodes = () => {
  return phoneUtil.getSupportedRegions();
};

export const getMaxNationalNumberLength = (region: string): number => {
  try {
    const exampleTypes = [
      phoneUtil.getExampleNumber(region),
      phoneUtil.getExampleNumberForType(region, 1),
      phoneUtil.getExampleNumberForType(region, 0),
    ];

    for (const example of exampleTypes) {
      if (example) {
        const nationalNumber = example.getNationalNumber()?.toString();
        if (nationalNumber) {
          return nationalNumber.length + 4;
        }
      }
    }
  } catch {}
  return 15;
};

export const getPhoneCodes = () => {
  return phoneUtil.getSupportedRegions().map((region) => ({
    code: phoneUtil.getCountryCodeForRegion(region),
    region,
  }));
};
