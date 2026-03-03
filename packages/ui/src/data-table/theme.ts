import { themeQuartz } from 'ag-grid-community';

const baseParams = {
  fontFamily: 'var(--mantine-font-family, -apple-system, sans-serif)',
  fontSize: 14,
  backgroundColor: 'var(--mantine-color-body)',
  foregroundColor: 'var(--mantine-color-text)',
  oddRowBackgroundColor: 'var(--mantine-color-default-hover)',
  rowHoverColor: 'var(--mantine-primary-color-light-hover)',
  borderColor: 'var(--mantine-color-default-border)',
  selectedRowBackgroundColor: 'var(--mantine-primary-color-light)',
  rangeSelectionBorderColor: 'var(--mantine-primary-color-filled)',
  accentColor: 'var(--mantine-primary-color-filled)',
  inputFocusBorder: true,
};

export const dataTableTheme = themeQuartz.withParams({
  ...baseParams,
  headerHeight: 48,
  rowHeight: 48,
  headerBackgroundColor: 'var(--mantine-color-default)',
  headerTextColor: 'var(--mantine-color-text)',
  borderRadius: 8,
  wrapperBorderRadius: 8,
  chromeBackgroundColor: {
    ref: 'foregroundColor',
    mix: 0.07,
    onto: 'backgroundColor',
  },
  browserColorScheme: 'inherit',
});

export const drawerListTheme = themeQuartz.withParams({
  ...baseParams,
  borderRadius: 0,
  wrapperBorderRadius: 0,
  chromeBackgroundColor: {
    ref: 'foregroundColor',
    mix: 0.07,
    onto: 'backgroundColor',
  },
  browserColorScheme: 'inherit',
});
