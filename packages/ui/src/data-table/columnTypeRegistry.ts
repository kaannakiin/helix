import type { ColTypeDefs } from 'ag-grid-community';

export const HELIX_COLUMN_TYPES: ColTypeDefs = {
  dateColumn: {
    headerClass: 'ag-left-aligned-header',
    cellClass: 'ag-left-aligned-cell',
  },
  datetimeColumn: {
    headerClass: 'ag-left-aligned-header',
    cellClass: 'ag-left-aligned-cell',
  },
  booleanColumn: {
    headerClass: 'ag-center-aligned-header',
    cellClass: 'ag-center-aligned-cell',
  },
  badgeColumn: {
    headerClass: 'ag-center-aligned-header',
    cellClass: 'ag-center-aligned-cell',
  },
  localeColumn: {
    headerClass: 'ag-left-aligned-header',
    cellClass: 'ag-left-aligned-cell',
  },
  actionColumn: {
    headerClass: 'ag-center-aligned-header',
    cellClass: 'ag-center-aligned-cell',
  },
};
