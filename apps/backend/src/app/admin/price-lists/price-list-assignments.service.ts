import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  PriceListAssignmentCreateOutput,
  PriceListAssignmentUpdateOutput,
} from '@org/schemas/admin/pricing';
import { PrismaService } from '../../prisma/prisma.service.js';

const ASSIGNMENT_INCLUDE = {
  customerGroup: true,
  organization: true,
  customer: true,
} as const;

@Injectable()
export class PriceListAssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(priceListId: string) {
    return this.prisma.priceListAssignment.findMany({
      where: { priceListId },
      include: ASSIGNMENT_INCLUDE,
      orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async findOne(priceListId: string, assignmentId: string) {
    const record = await this.prisma.priceListAssignment.findFirst({
      where: { id: assignmentId, priceListId },
      include: ASSIGNMENT_INCLUDE,
    });
    if (!record)
      throw new NotFoundException('backend.errors.assignment_not_found');
    return record;
  }

  async create(priceListId: string, data: PriceListAssignmentCreateOutput) {
    const priceList = await this.prisma.priceList.findUnique({
      where: { id: priceListId },
      select: { storeId: true },
    });
    if (!priceList)
      throw new NotFoundException('backend.errors.price_list_not_found');

    await this.validateAssignmentStoreScope(
      priceList.storeId,
      data.targetType,
      data
    );

    const existing = await this.prisma.priceListAssignment.findFirst({
      where: {
        priceListId,
        targetType: data.targetType,
        customerGroupId: data.customerGroupId,
        organizationId: data.organizationId,
        customerId: data.customerId,
      },
    });
    if (existing)
      throw new ConflictException('backend.errors.assignment_duplicate');

    return this.prisma.priceListAssignment.create({
      data: { priceListId, ...data },
      include: ASSIGNMENT_INCLUDE,
    });
  }

  private async validateAssignmentStoreScope(
    storeId: string,
    targetType: string,
    data: PriceListAssignmentCreateOutput
  ): Promise<void> {
    if (targetType === 'CUSTOMER_GROUP' && data.customerGroupId) {
      const group = await this.prisma.customerGroup.findUnique({
        where: { id: data.customerGroupId },
        select: { storeId: true },
      });
      if (!group)
        throw new NotFoundException('backend.errors.customer_group_not_found');
      if (group.storeId !== storeId)
        throw new BadRequestException('backend.errors.assignment_cross_store');
    }

    if (targetType === 'ORGANIZATION' && data.organizationId) {
      const org = await this.prisma.organization.findUnique({
        where: { id: data.organizationId },
        select: { storeId: true },
      });
      if (!org)
        throw new NotFoundException('backend.errors.organization_not_found');
      if (org.storeId !== storeId)
        throw new BadRequestException('backend.errors.assignment_cross_store');
    }

    if (targetType === 'CUSTOMER' && data.customerId) {
      const customer = await this.prisma.customer.findUnique({
        where: { id: data.customerId },
        select: { storeId: true },
      });
      if (!customer)
        throw new NotFoundException('backend.errors.customer_not_found');
      if (customer.storeId !== storeId)
        throw new BadRequestException('backend.errors.assignment_cross_store');
    }
  }

  async update(
    priceListId: string,
    assignmentId: string,
    data: PriceListAssignmentUpdateOutput
  ) {
    await this.findOne(priceListId, assignmentId);
    return this.prisma.priceListAssignment.update({
      where: { id: assignmentId },
      data,
      include: ASSIGNMENT_INCLUDE,
    });
  }

  async delete(priceListId: string, assignmentId: string): Promise<void> {
    await this.findOne(priceListId, assignmentId);
    await this.prisma.priceListAssignment.delete({
      where: { id: assignmentId },
    });
  }
}
