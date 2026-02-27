import { DATA_ACCESS_KEYS } from '@org/constants/data-keys';
import type {
  GeolocationCityPrismaType,
  GeolocationCountryPrismaType,
  GeolocationDistrictPrismaType,
  GeolocationStatePrismaType,
  GeolocationTownPrismaType,
} from '@org/types/admin/geolocation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api/api-client';

export const useCountries = () => {
  return useQuery({
    queryKey: DATA_ACCESS_KEYS.locations.countries,
    queryFn: async () => {
      const res = await apiClient.get<GeolocationCountryPrismaType[]>(
        '/locations/countries'
      );
      return res.data;
    },
  });
};

export const useStates = (countryId: string) => {
  return useQuery({
    queryKey: DATA_ACCESS_KEYS.locations.states(countryId),
    queryFn: async () => {
      const res = await apiClient.get<GeolocationStatePrismaType[]>(
        '/locations/states',
        { params: { countryId } }
      );
      return res.data;
    },
  });
};

export const useCities = (params: {
  stateId?: string;
  countryId?: string;
}) => {
  return useQuery({
    queryKey: DATA_ACCESS_KEYS.locations.cities(params),
    queryFn: async () => {
      const res = await apiClient.get<GeolocationCityPrismaType[]>(
        '/locations/cities',
        { params }
      );
      return res.data;
    },
  });
};

export const useDistricts = (cityId: string) => {
  return useQuery({
    queryKey: DATA_ACCESS_KEYS.locations.districts(cityId),
    queryFn: async () => {
      const res = await apiClient.get<GeolocationDistrictPrismaType[]>(
        '/locations/districts',
        { params: { cityId } }
      );
      return res.data;
    },
  });
};

export const useTowns = (districtId: string) => {
  return useQuery({
    queryKey: DATA_ACCESS_KEYS.locations.towns(districtId),
    queryFn: async () => {
      const res = await apiClient.get<GeolocationTownPrismaType[]>(
        '/locations/towns',
        { params: { districtId } }
      );
      return res.data;
    },
  });
};
