import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Locale, Prisma } from '@org/prisma/client';
import {
  GeolocationCityListQuery,
  GeolocationCountryListQuery,
  GeolocationDistrictListQuery,
  GeolocationStateListQuery,
} from '@org/types/admin/geolocation';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GeolocationService {
  constructor(private readonly prisma: PrismaService) {}

  async getCountries(lang: Locale, q?: string) {
    const where: Prisma.CountryWhereInput = {
      isActive: true,
      ...(q
        ? {
            translations: {
              some: {
                locale: lang,
                name: { contains: q, mode: 'insensitive' as const },
              },
            },
          }
        : {}),
    };

    return this.prisma.country.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: {
        ...GeolocationCountryListQuery,
        translations: { where: { locale: lang } },
      },
    });
  }

  async getCountryById(id: string, lang: Locale) {
    const country = await this.prisma.country.findUnique({
      where: { id },
      include: {
        ...GeolocationCountryListQuery,
        translations: { where: { locale: lang } },
      },
    });

    if (!country) {
      throw new NotFoundException('backend.errors.country_not_found');
    }

    return country;
  }

  async getStates(countryId: string, lang: Locale, q?: string) {
    const where: Prisma.StateWhereInput = {
      countryId,
      isActive: true,
      name: { not: 'default' },
      ...(q
        ? {
            translations: {
              some: {
                locale: lang,
                name: { contains: q, mode: 'insensitive' as const },
              },
            },
          }
        : {}),
    };

    return this.prisma.state.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: {
        ...GeolocationStateListQuery,
        translations: { where: { locale: lang } },
      },
    });
  }

  async getCities(
    opts: { stateId?: string; countryId?: string },
    q?: string
  ) {
    if (!opts.stateId && !opts.countryId) {
      throw new BadRequestException(
        'backend.errors.state_or_country_required'
      );
    }

    const where: Prisma.CityWhereInput = {
      isActive: true,
      ...(opts.stateId ? { stateId: opts.stateId } : {}),
      ...(opts.countryId ? { countryId: opts.countryId } : {}),
      ...(q
        ? { name: { contains: q, mode: 'insensitive' as const } }
        : {}),
    };

    return this.prisma.city.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: GeolocationCityListQuery,
    });
  }

  async getDistricts(cityId: string, q?: string) {
    const where: Prisma.DistrictWhereInput = {
      cityId,
      isActive: true,
      ...(q
        ? { name: { contains: q, mode: 'insensitive' as const } }
        : {}),
    };

    return this.prisma.district.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: GeolocationDistrictListQuery,
    });
  }

  async getTowns(districtId: string, q?: string) {
    const where: Prisma.TownWhereInput = {
      districtId,
      isActive: true,
      ...(q
        ? { name: { contains: q, mode: 'insensitive' as const } }
        : {}),
    };

    return this.prisma.town.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });
  }
}
