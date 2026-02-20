'use client';

import { AllCommunityModule, LocaleModule } from 'ag-grid-community';
import { AgGridProvider } from 'ag-grid-react';
import type { ReactNode } from 'react';

const modules = [AllCommunityModule, LocaleModule];

export default function DataTableProvider({
  children,
}: {
  children: ReactNode;
}) {
  return <AgGridProvider modules={modules}>{children}</AgGridProvider>;
}
