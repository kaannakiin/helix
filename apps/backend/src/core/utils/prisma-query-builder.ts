import { Prisma } from '@org/prisma/client';
import type {
  FilterCondition,
  SearchParam,
  SortCondition,
} from '@org/types/data-query';

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

function conditionToPrisma(
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

export interface CountFilter {
  relation: string;
  condition: Record<string, unknown>;
}

export interface PrismaQueryResult {
  where: Record<string, unknown>;
  orderBy: Record<string, unknown>[] | Record<string, unknown>;
  skip: number;
  take: number;
  countFilters: CountFilter[];
}

export function buildPrismaQuery(params: {
  page: number;
  limit: number;
  filters?: Record<string, FilterCondition> | Record<string, unknown>;
  sort?: SortCondition[];
  defaultSort?: { field: string; order: 'asc' | 'desc' };
  search?: SearchParam;
}): PrismaQueryResult {
  const { page, limit, filters, sort, defaultSort, search } = params;

  const where: Record<string, unknown> = {};
  const countFilters: CountFilter[] = [];

  if (filters) {
    for (const [field, condition] of Object.entries(filters)) {
      if (field.startsWith('_count.')) {
        const relation = field.split('.')[1];
        countFilters.push({
          relation,
          condition: numberToPrisma(
            (condition as FilterCondition & { op: string }).op,
            (condition as FilterCondition & { value: number }).value,
            (condition as FilterCondition & { valueTo?: number }).valueTo
          ),
        });
      } else {
        where[field] = conditionToPrisma(condition as FilterCondition);
      }
    }
  }

  if (search?.value && search.fields.length > 0) {
    where['OR'] = search.fields.map((field) => {
      if (field.startsWith('_')) {
        const dotIdx = field.indexOf('.');
        const relationName = field.slice(1, dotIdx);
        const relationField = field.slice(dotIdx + 1);
        return {
          [relationName]: {
            some: {
              [relationField]: { contains: search.value, mode: 'insensitive' },
            },
          },
        };
      }
      return { [field]: { contains: search.value, mode: 'insensitive' } };
    });
  }

  let orderBy: Record<string, unknown>[] | Record<string, unknown>;

  if (sort && sort.length > 0) {
    orderBy = sort.map((s) => {
      if (s.field.startsWith('_count.')) {
        const relation = s.field.split('.')[1];
        return { [relation]: { _count: s.order } };
      }
      if (s.field.includes('.')) {
        const [parent, child] = s.field.split('.');
        return { [parent]: { [child]: s.order } };
      }
      return { [s.field]: s.order };
    });
  } else if (defaultSort) {
    orderBy = { [defaultSort.field]: defaultSort.order };
  } else {
    orderBy = { createdAt: 'desc' };
  }

  return {
    where,
    orderBy,
    skip: (page - 1) * limit,
    take: limit,
    countFilters,
  };
}

export interface CountRelationMap {
  [relation: string]: { table: string; fk: string };
}

const SAFE_IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

function assertSafeIdentifier(name: string): void {
  if (!SAFE_IDENTIFIER.test(name)) {
    throw new Error(`Unsafe SQL identifier: ${name}`);
  }
}

function buildHavingClause(cond: Record<string, unknown>): Prisma.Sql {
  const parts: Prisma.Sql[] = [];
  for (const [op, val] of Object.entries(cond)) {
    const value = Number(val);
    switch (op) {
      case 'equals':
        parts.push(Prisma.sql`COUNT(*) = ${value}`);
        break;
      case 'gt':
        parts.push(Prisma.sql`COUNT(*) > ${value}`);
        break;
      case 'lt':
        parts.push(Prisma.sql`COUNT(*) < ${value}`);
        break;
      case 'gte':
        parts.push(Prisma.sql`COUNT(*) >= ${value}`);
        break;
      case 'lte':
        parts.push(Prisma.sql`COUNT(*) <= ${value}`);
        break;
    }
  }
  return Prisma.join(parts, ' AND ');
}

export async function resolveCountFilters(
  prisma: { $queryRaw: (query: Prisma.Sql) => Promise<unknown> },
  tableName: string,
  relationMap: CountRelationMap,
  countFilters: CountFilter[],
  where: Record<string, unknown>
): Promise<Record<string, unknown>> {
  if (countFilters.length === 0) return where;

  for (const cf of countFilters) {
    const rel = relationMap[cf.relation];
    if (!rel) continue;

    assertSafeIdentifier(tableName);
    assertSafeIdentifier(rel.table);
    assertSafeIdentifier(rel.fk);

    const tbl = Prisma.raw(`"${tableName}"`);
    const relTbl = Prisma.raw(`"${rel.table}"`);
    const fk = Prisma.raw(`"${rel.fk}"`);
    const having = buildHavingClause(cf.condition);

    const rows = (await prisma.$queryRaw(Prisma.sql`
      SELECT p."id"
      FROM ${tbl} p
      LEFT JOIN ${relTbl} r ON r.${fk} = p."id"
      GROUP BY p."id"
      HAVING ${having}
    `)) as { id: string }[];

    const ids = rows.map((r) => r.id);

    where = {
      AND: [where, { id: { in: ids } }],
    };
  }

  return where;
}
