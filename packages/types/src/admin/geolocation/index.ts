import type { Prisma } from '@org/prisma/browser';

export const GeolocationCountryListQuery = {
  translations: true,
} as const satisfies Prisma.CountryInclude;

export type GeolocationCountryPrismaType = Prisma.CountryGetPayload<{
  include: typeof GeolocationCountryListQuery;
}>;

export const GeolocationStateListQuery = {
  translations: true,
  _count: { select: { cities: true } },
} as const satisfies Prisma.StateInclude;

export type GeolocationStatePrismaType = Prisma.StateGetPayload<{
  include: typeof GeolocationStateListQuery;
}>;

export const GeolocationCityListQuery = {
  _count: { select: { districts: true } },
} as const satisfies Prisma.CityInclude;

export type GeolocationCityPrismaType = Prisma.CityGetPayload<{
  include: typeof GeolocationCityListQuery;
}>;

export const GeolocationDistrictListQuery = {
  _count: { select: { towns: true } },
} as const satisfies Prisma.DistrictInclude;

export type GeolocationDistrictPrismaType = Prisma.DistrictGetPayload<{
  include: typeof GeolocationDistrictListQuery;
}>;

export type GeolocationTownPrismaType = Prisma.TownGetPayload<object>;
