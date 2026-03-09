'use client';

import {
  useCities,
  useCountries,
  useDistricts,
  useStates,
  useTowns,
} from '@/core/hooks/useGeolocation';
import { Center, Loader, Stack, Text, Title } from '@mantine/core';
import type {
  GeolocationCityPrismaType,
  GeolocationCountryPrismaType,
  GeolocationDistrictPrismaType,
  GeolocationStatePrismaType,
  GeolocationTownPrismaType,
} from '@org/types/admin/geolocation';
import {
  ExpandableDataTable,
  useColumnFactory,
  type ExpandableRowConfig,
} from '@org/ui';
import type { ColDef } from 'ag-grid-community';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

function TownsPanel({ data }: { data: GeolocationDistrictPrismaType }) {
  const t = useTranslations('frontend.admin.locations');
  const { createColumn } = useColumnFactory();

  const { data: towns = [], isLoading } = useTowns(data.id);

  const columns = useMemo<ColDef<GeolocationTownPrismaType>[]>(
    () => [
      createColumn<GeolocationTownPrismaType>('name', {
        type: 'text',
        headerName: t('table.town'),
        minWidth: 200,
      }),
    ],
    [createColumn, t]
  );

  if (isLoading) {
    return (
      <Center h="100%">
        <Loader size="sm" />
      </Center>
    );
  }

  if (towns.length === 0) {
    return (
      <Center h="100%">
        <Text c="dimmed" size="sm">
          {t('empty.towns')}
        </Text>
      </Center>
    );
  }

  return (
    <div style={{ height: '100%', padding: '4px 8px 8px' }}>
      <ExpandableDataTable<GeolocationTownPrismaType>
        columns={columns}
        rowData={towns}
        height="100%"
        idPrefix="towns"
        expandableRow={{
          getRowId: (row) => row.id,
          isExpandable: () => false,
          fullWidthCellRenderer: () => null,
        }}
        gridOptions={{ suppressCellFocus: true }}
      />
    </div>
  );
}

function DistrictsPanel({ data }: { data: GeolocationCityPrismaType }) {
  const t = useTranslations('frontend.admin.locations');
  const { createColumn } = useColumnFactory();

  const { data: districts = [], isLoading } = useDistricts(data.id);

  const columns = useMemo<ColDef<GeolocationDistrictPrismaType>[]>(
    () => [
      createColumn<GeolocationDistrictPrismaType>('name', {
        type: 'text',
        headerName: t('table.district'),
        minWidth: 200,
      }),
    ],
    [createColumn, t]
  );

  const expandableRow = useMemo<
    ExpandableRowConfig<GeolocationDistrictPrismaType>
  >(
    () => ({
      getRowId: (row) => row.id,
      isExpandable: (row) => row._count.towns > 0,
      fullWidthCellRenderer: TownsPanel,
      expandOnRowClick: true,
      singleExpand: true,
      detailHeight: 250,
    }),
    []
  );

  if (isLoading) {
    return (
      <Center h="100%">
        <Loader size="sm" />
      </Center>
    );
  }

  if (districts.length === 0) {
    return (
      <Center h="100%">
        <Text c="dimmed" size="sm">
          {t('empty.districts')}
        </Text>
      </Center>
    );
  }

  return (
    <div style={{ height: '100%', padding: '4px 8px 8px' }}>
      <ExpandableDataTable<GeolocationDistrictPrismaType>
        columns={columns}
        rowData={districts}
        height="100%"
        idPrefix="districts"
        expandableRow={expandableRow}
        gridOptions={{ suppressCellFocus: true }}
      />
    </div>
  );
}

function CitiesPanel({
  data,
  queryParams,
}: {
  data: GeolocationStatePrismaType | GeolocationCountryPrismaType;
  queryParams: { stateId?: string; countryId?: string };
}) {
  const t = useTranslations('frontend.admin.locations');
  const { createColumn } = useColumnFactory();

  const { data: cities = [], isLoading } = useCities(queryParams);

  const columns = useMemo<ColDef<GeolocationCityPrismaType>[]>(
    () => [
      createColumn<GeolocationCityPrismaType>('name', {
        type: 'text',
        headerName: t('table.city'),
        minWidth: 200,
      }),
    ],
    [createColumn, t]
  );

  const expandableRow = useMemo<ExpandableRowConfig<GeolocationCityPrismaType>>(
    () => ({
      getRowId: (row) => row.id,
      isExpandable: (row) => row._count.districts > 0,
      fullWidthCellRenderer: DistrictsPanel,
      expandOnRowClick: true,
      singleExpand: true,
      detailHeight: 300,
    }),
    []
  );

  if (isLoading) {
    return (
      <Center h="100%">
        <Loader size="sm" />
      </Center>
    );
  }

  if (cities.length === 0) {
    return (
      <Center h="100%">
        <Text c="dimmed" size="sm">
          {t('empty.cities')}
        </Text>
      </Center>
    );
  }

  return (
    <div style={{ height: '100%', padding: '4px 8px 8px' }}>
      <ExpandableDataTable<GeolocationCityPrismaType>
        columns={columns}
        rowData={cities}
        height="100%"
        idPrefix="cities"
        expandableRow={expandableRow}
        gridOptions={{ suppressCellFocus: true }}
      />
    </div>
  );
}

function StatesPanel({ data }: { data: GeolocationCountryPrismaType }) {
  const t = useTranslations('frontend.admin.locations');
  const { createColumn } = useColumnFactory();

  const { data: states = [], isLoading } = useStates(data.id);

  const columns = useMemo<ColDef<GeolocationStatePrismaType>[]>(
    () => [
      createColumn<GeolocationStatePrismaType>('name', {
        type: 'text',
        headerName: t('table.state'),
        minWidth: 200,
        valueGetter: (params) =>
          params.data?.translations?.[0]?.name ?? params.data?.name ?? '',
      }),
      createColumn<GeolocationStatePrismaType>('stateCode', {
        type: 'text',
        headerName: t('table.stateCode'),
        width: 100,
        flex: 0,
      }),
    ],
    [createColumn, t]
  );

  const expandableRow = useMemo<
    ExpandableRowConfig<GeolocationStatePrismaType>
  >(
    () => ({
      getRowId: (row) => row.id,
      isExpandable: (row) => row._count.cities > 0,
      fullWidthCellRenderer: ({ data: stateData }) => (
        <CitiesPanel data={stateData} queryParams={{ stateId: stateData.id }} />
      ),
      expandOnRowClick: true,
      singleExpand: true,
      detailHeight: 350,
    }),
    []
  );

  if (isLoading) {
    return (
      <Center h="100%">
        <Loader size="sm" />
      </Center>
    );
  }

  if (states.length === 0) {
    return (
      <Center h="100%">
        <Text c="dimmed" size="sm">
          {t('empty.states')}
        </Text>
      </Center>
    );
  }

  return (
    <div style={{ height: '100%', padding: '4px 8px 8px' }}>
      <ExpandableDataTable<GeolocationStatePrismaType>
        columns={columns}
        rowData={states}
        height="100%"
        idPrefix="states"
        expandableRow={expandableRow}
        gridOptions={{ suppressCellFocus: true }}
      />
    </div>
  );
}

function CountryDetailPanel({ data }: { data: GeolocationCountryPrismaType }) {
  if (data.countryType === 'HAS_STATES') {
    return <StatesPanel data={data} />;
  }

  if (data.countryType === 'HAS_CITIES_ONLY') {
    return <CitiesPanel data={data} queryParams={{ countryId: data.id }} />;
  }

  return null;
}

export default function LocationsPage() {
  const t = useTranslations('frontend.admin.locations');
  const tEnums = useTranslations('frontend.enums');
  const { createColumn } = useColumnFactory();

  const { data: countries = [], isLoading } = useCountries();

  const columns = useMemo<ColDef<GeolocationCountryPrismaType>[]>(
    () => [
      createColumn<GeolocationCountryPrismaType>('emoji', {
        headerName: t('table.flag'),
        type: 'text',
        width: 60,
        flex: 0,
        sortable: false,
        filter: false,
      }),
      createColumn<GeolocationCountryPrismaType>('id', {
        headerName: t('table.country'),
        type: 'text',
        minWidth: 200,
        valueGetter: (params) => params.data?.translations?.[0]?.name ?? '',
      }),
      createColumn<GeolocationCountryPrismaType>('code', {
        headerName: t('table.code'),
        type: 'text',
        width: 80,
        flex: 0,
      }),
      createColumn<GeolocationCountryPrismaType>('iso3', {
        headerName: t('table.iso3'),
        type: 'text',
        width: 80,
        flex: 0,
      }),
      createColumn<GeolocationCountryPrismaType>('phoneCode', {
        headerName: t('table.phone'),
        type: 'text',
        width: 100,
        flex: 0,
      }),
      createColumn<GeolocationCountryPrismaType>('countryType', {
        headerName: t('table.type'),
        type: 'badge',
        minWidth: 140,
        colorMap: {
          HAS_STATES: 'blue',
          HAS_CITIES_ONLY: 'green',
          COUNTRY_ONLY: 'gray',
        },
        enumOptions: [
          { value: 'HAS_STATES', label: tEnums('countryType.HAS_STATES') },
          {
            value: 'HAS_CITIES_ONLY',
            label: tEnums('countryType.HAS_CITIES_ONLY'),
          },
          { value: 'COUNTRY_ONLY', label: tEnums('countryType.COUNTRY_ONLY') },
        ],
      }),
    ],
    [createColumn, t, tEnums]
  );

  const expandableRow = useMemo<
    ExpandableRowConfig<GeolocationCountryPrismaType>
  >(
    () => ({
      getRowId: (row) => row.id,
      isExpandable: (row) => row.countryType !== 'COUNTRY_ONLY',
      fullWidthCellRenderer: CountryDetailPanel,
      expandOnRowClick: true,
      singleExpand: true,
      detailHeight: 400,
    }),
    []
  );

  return (
    <Stack gap="md" className="flex-1">
      <div>
        <Title order={2}>{t('title')}</Title>
        <Text c="dimmed" mt="xs">
          {t('subtitle')}
        </Text>
      </div>

      <ExpandableDataTable<GeolocationCountryPrismaType>
        tableId="geolocation-countries"
        columns={columns}
        rowData={countries}
        expandableRow={expandableRow}
        height="calc(100vh - 180px)"
        loading={isLoading}
        gridOptions={{
          suppressCellFocus: true,
        }}
      />
    </Stack>
  );
}
