import { AssignmentTargetType } from '@org/prisma/browser';
import { z } from 'zod';
import { V } from '../../common/validation-keys.js';

const BasePriceListAssignmentCreateSchema = z.object({
  targetType: z.enum(AssignmentTargetType, { error: V.REQUIRED }),
  customerGroupId: z.string().min(1).nullable().default(null),
  organizationId: z.string().min(1).nullable().default(null),
  customerId: z.string().min(1).nullable().default(null),
  priority: z.number().int().nonnegative().default(0),
});

const checkAssignment = ({
  issues,
  value,
}: {
  issues: z.core.$ZodRawIssue[];
  value: z.output<typeof BasePriceListAssignmentCreateSchema>;
}) => {
  const { targetType, customerGroupId, organizationId, customerId } = value;

  switch (targetType) {
    case 'ALL_CUSTOMERS':
      if (customerGroupId || organizationId || customerId) {
        issues.push({
          code: 'custom',
          input: targetType,
          error: V.ASSIGNMENT_RELATION_MUST_BE_NULL,
          path: ['targetType'],
        });
      }
      break;
    case 'CUSTOMER_GROUP':
      if (!customerGroupId) {
        issues.push({
          code: 'custom',
          input: customerGroupId,
          error: V.ASSIGNMENT_RELATION_REQUIRED,
          path: ['customerGroupId'],
        });
      }
      if (organizationId || customerId) {
        issues.push({
          code: 'custom',
          input: targetType,
          error: V.ASSIGNMENT_RELATION_MUST_BE_NULL,
          path: ['targetType'],
        });
      }
      break;
    case 'ORGANIZATION':
      if (!organizationId) {
        issues.push({
          code: 'custom',
          input: organizationId,
          error: V.ASSIGNMENT_RELATION_REQUIRED,
          path: ['organizationId'],
        });
      }
      if (customerGroupId || customerId) {
        issues.push({
          code: 'custom',
          input: targetType,
          error: V.ASSIGNMENT_RELATION_MUST_BE_NULL,
          path: ['targetType'],
        });
      }
      break;
    case 'CUSTOMER':
      if (!customerId) {
        issues.push({
          code: 'custom',
          input: customerId,
          error: V.ASSIGNMENT_RELATION_REQUIRED,
          path: ['customerId'],
        });
      }
      if (customerGroupId || organizationId) {
        issues.push({
          code: 'custom',
          input: targetType,
          error: V.ASSIGNMENT_RELATION_MUST_BE_NULL,
          path: ['targetType'],
        });
      }
      break;
  }
};

export const PriceListAssignmentCreateSchema =
  BasePriceListAssignmentCreateSchema.check(checkAssignment);

export const PriceListAssignmentUpdateSchema = z.object({
  priority: z.number().int().nonnegative(),
});

export type PriceListAssignmentCreateInput = z.input<
  typeof PriceListAssignmentCreateSchema
>;
export type PriceListAssignmentCreateOutput = z.output<
  typeof PriceListAssignmentCreateSchema
>;
export type PriceListAssignmentUpdateInput = z.input<
  typeof PriceListAssignmentUpdateSchema
>;
export type PriceListAssignmentUpdateOutput = z.output<
  typeof PriceListAssignmentUpdateSchema
>;
