import type { FilterCondition } from '@org/types/data-query';

export function textToPrisma(
  op: string,
  value: string
): Record<string, unknown> {
  switch (op) {
    case 'contains':
      return { contains: value, mode: 'insensitive' };
    case 'equals':
      return { equals: value, mode: 'insensitive' };
    case 'startsWith':
      return { startsWith: value, mode: 'insensitive' };
    case 'endsWith':
      return { endsWith: value, mode: 'insensitive' };
    default:
      return { contains: value, mode: 'insensitive' };
  }
}

export function numberToPrisma(
  op: string,
  value: number,
  valueTo?: number
): Record<string, unknown> {
  switch (op) {
    case 'equals':
      return { equals: value };
    case 'gt':
      return { gt: value };
    case 'lt':
      return { lt: value };
    case 'gte':
      return { gte: value };
    case 'lte':
      return { lte: value };
    case 'between':
      return { gte: value, lte: valueTo };
    default:
      return { equals: value };
  }
}

export function dateToPrisma(
  op: string,
  value: string,
  valueTo?: string
): Record<string, unknown> {
  switch (op) {
    case 'equals':
      return { equals: new Date(value) };
    case 'gt':
      return { gt: new Date(value) };
    case 'lt':
      return { lt: new Date(value) };
    case 'between':
      return { gte: new Date(value), lte: new Date(valueTo!) };
    default:
      return { equals: new Date(value) };
  }
}

export function booleanToPrisma(value: boolean): Record<string, unknown> {
  return { equals: value };
}

export function enumToPrisma(
  op: string,
  value: string | string[]
): Record<string, unknown> {
  if (op === 'in' || Array.isArray(value)) {
    return { in: Array.isArray(value) ? value : [value] };
  }
  return { equals: value };
}

export function conditionToPrisma(
  condition: FilterCondition
): Record<string, unknown> {
  switch (condition.filterType) {
    case 'text':
      return textToPrisma(condition.op, condition.value);
    case 'number':
      return numberToPrisma(condition.op, condition.value, condition.valueTo);
    case 'date':
      return dateToPrisma(condition.op, condition.value, condition.valueTo);
    case 'boolean':
      return booleanToPrisma(condition.value);
    case 'enum':
      return enumToPrisma(condition.op, condition.value);
  }
}
