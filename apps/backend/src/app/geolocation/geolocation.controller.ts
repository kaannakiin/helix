import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Locale } from '@org/prisma/client';
import { Public } from '../../core/decorators';
import { LocaleDecorator } from '../../core/decorators/locale.decorator';
import { GeolocationService } from './geolocation.service';

@ApiTags('Locations')
@Controller('locations')
@Public()
export class GeolocationController {
  constructor(private readonly geolocationService: GeolocationService) {}

  @Get('countries')
  @ApiOperation({ summary: 'List all countries' })
  @ApiQuery({ name: 'q', required: false, description: 'Search by name' })
  async getCountries(
    @LocaleDecorator() lang: Locale,
    @Query('q') q?: string
  ) {
    return this.geolocationService.getCountries(lang, q);
  }

  @Get('countries/:id')
  @ApiOperation({ summary: 'Get country details by ID' })
  @ApiParam({ name: 'id', description: 'Country ID' })
  async getCountryById(
    @Param('id') id: string,
    @LocaleDecorator() lang: Locale
  ) {
    return this.geolocationService.getCountryById(id, lang);
  }

  @Get('states')
  @ApiOperation({ summary: 'List states for a country' })
  @ApiQuery({ name: 'countryId', required: true })
  @ApiQuery({ name: 'q', required: false, description: 'Search by name' })
  async getStates(
    @Query('countryId') countryId: string,
    @LocaleDecorator() lang: Locale,
    @Query('q') q?: string
  ) {
    return this.geolocationService.getStates(countryId, lang, q);
  }

  @Get('cities')
  @ApiOperation({ summary: 'List cities for a state or country' })
  @ApiQuery({
    name: 'stateId',
    required: false,
    description: 'Filter by state ID',
  })
  @ApiQuery({
    name: 'countryId',
    required: false,
    description: 'Filter by country ID (for HAS_CITIES_ONLY countries)',
  })
  @ApiQuery({ name: 'q', required: false, description: 'Search by name' })
  async getCities(
    @Query('stateId') stateId?: string,
    @Query('countryId') countryId?: string,
    @Query('q') q?: string
  ) {
    return this.geolocationService.getCities({ stateId, countryId }, q);
  }

  @Get('districts')
  @ApiOperation({ summary: 'List districts for a city' })
  @ApiQuery({ name: 'cityId', required: true })
  @ApiQuery({ name: 'q', required: false, description: 'Search by name' })
  async getDistricts(
    @Query('cityId') cityId: string,
    @Query('q') q?: string
  ) {
    return this.geolocationService.getDistricts(cityId, q);
  }

  @Get('towns')
  @ApiOperation({ summary: 'List towns for a district' })
  @ApiQuery({ name: 'districtId', required: true })
  @ApiQuery({ name: 'q', required: false, description: 'Search by name' })
  async getTowns(
    @Query('districtId') districtId: string,
    @Query('q') q?: string
  ) {
    return this.geolocationService.getTowns(districtId, q);
  }
}
