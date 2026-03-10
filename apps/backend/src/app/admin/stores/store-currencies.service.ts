import { Injectable, NotFoundException } from '@nestjs/common';
import type { StoreCurrency } from '@org/prisma/client';
import type {
  StoreCurrencyCreateOutput,
  StoreCurrencyUpdateOutput,
} from '@org/schemas/admin/settings';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class StoreCurrenciesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(storeId: string): Promise<StoreCurrency[]> {
    return this.prisma.storeCurrency.findMany({
      where: { storeId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async findOne(storeId: string, currencyId: string): Promise<StoreCurrency> {
    const record = await this.prisma.storeCurrency.findFirst({
      where: { id: currencyId, storeId },
    });
    if (!record)
      throw new NotFoundException('backend.errors.store_currency_not_found');
    return record;
  }

  async create(
    storeId: string,
    data: StoreCurrencyCreateOutput
  ): Promise<StoreCurrency> {
    return this.prisma.storeCurrency.create({
      data: { storeId, ...data },
    });
  }

  async update(
    storeId: string,
    currencyId: string,
    data: StoreCurrencyUpdateOutput
  ): Promise<StoreCurrency> {
    await this.findOne(storeId, currencyId);
    return this.prisma.storeCurrency.update({
      where: { id: currencyId },
      data,
    });
  }

  async delete(storeId: string, currencyId: string): Promise<void> {
    await this.findOne(storeId, currencyId);
    await this.prisma.storeCurrency.delete({ where: { id: currencyId } });
  }
}
