import type { OrgMemberRole, Prisma } from '../client.js';
import { prisma } from '../prisma.js';
import {
  ORG_CLOSURE_ID_PREFIX,
  ORG_ID_PREFIX,
  ORG_MEMBER_ID_PREFIX,
  ORG_SEED_BASE,
  ORG_TREE_TEMPLATES,
  type OrgTemplate,
} from './organization-seed.config.js';

// ─── Types ───────────────────────────────────────────────────────────────────

interface FlatOrg {
  id: string;
  parentOrgId: string | null;
  depth: number;
  name: string;
  taxId: string;
  email: string;
  phone: string;
  address: string;
}

interface FlatMember {
  id: string;
  organizationId: string;
  customerId: string;
  role: OrgMemberRole;
  title: string | null;
  parentMemberId: string | null;
  depth: number; // depth within the member tree (0 = top)
}

interface ClosureRow {
  id: string;
  ancestorId: string;
  descendantId: string;
  depth: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function createSeedId(prefix: string, ...parts: Array<string | number>): string {
  return [prefix, ...parts]
    .map((part) =>
      String(part)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, ''),
    )
    .join('_');
}

// ─── Flatten org tree ────────────────────────────────────────────────────────

function flattenOrgTree(
  templates: readonly OrgTemplate[],
  storeSlug: string,
  parentOrgId: string | null,
  depth: number,
  counter: { value: number },
): FlatOrg[] {
  const result: FlatOrg[] = [];

  for (const template of templates) {
    counter.value += 1;
    const orgId = createSeedId(ORG_ID_PREFIX, storeSlug, counter.value);

    result.push({
      id: orgId,
      parentOrgId,
      depth,
      name: template.name,
      taxId: template.taxId,
      email: template.email,
      phone: template.phone,
      address: template.address,
    });

    if (template.children.length > 0) {
      result.push(
        ...flattenOrgTree(template.children, storeSlug, orgId, depth + 1, counter),
      );
    }
  }

  return result;
}

// ─── Assign members ─────────────────────────────────────────────────────────

const ROLE_SEQUENCE: OrgMemberRole[] = ['OWNER', 'MANAGER', 'MEMBER', 'MEMBER', 'MEMBER'];
const TITLE_MAP: Record<string, string> = {
  OWNER: 'CEO',
  MANAGER: 'Department Manager',
};

function assignMembers(
  orgs: FlatOrg[],
  customerIds: string[],
  storeSlug: string,
): { members: FlatMember[]; closures: ClosureRow[] } {
  const members: FlatMember[] = [];
  const closures: ClosureRow[] = [];

  let customerCursor = 0;
  let memberCounter = 0;
  let closureCounter = 0;

  // Build a map: orgId -> parentOrgId for member hierarchy linking
  const orgParentMap = new Map<string, string | null>();
  for (const org of orgs) {
    orgParentMap.set(org.id, org.parentOrgId);
  }

  // Map: orgId -> OWNER memberId (for building member tree across orgs)
  const orgOwnerMemberMap = new Map<string, string>();

  for (const org of orgs) {
    // More members for root orgs, fewer for leaves
    const memberCount = org.depth === 0 ? 5 : org.depth === 1 ? 3 : 2;
    const orgMembers: FlatMember[] = [];

    for (let i = 0; i < memberCount; i++) {
      if (customerCursor >= customerIds.length) {
        // Wrap around to reuse customers across orgs
        customerCursor = 0;
      }

      memberCounter += 1;
      const customerId = customerIds[customerCursor]!;
      customerCursor += 1;

      const role = ROLE_SEQUENCE[i % ROLE_SEQUENCE.length]!;
      const memberId = createSeedId(ORG_MEMBER_ID_PREFIX, storeSlug, memberCounter);

      // Parent member: within the org, members report to OWNER
      // OWNER of child org reports to OWNER of parent org
      let parentMemberId: string | null = null;
      let depthInTree = 0;

      if (role === 'OWNER' && org.parentOrgId) {
        // This org's OWNER reports to parent org's OWNER
        parentMemberId = orgOwnerMemberMap.get(org.parentOrgId) ?? null;
        if (parentMemberId) {
          const parentMember = members.find((m) => m.id === parentMemberId);
          depthInTree = parentMember ? parentMember.depth + 1 : 0;
        }
      } else if (role !== 'OWNER') {
        // Non-owners report to the OWNER of the same org
        const ownerOfThisOrg = orgMembers.find((m) => m.role === 'OWNER');
        if (ownerOfThisOrg) {
          parentMemberId = ownerOfThisOrg.id;
          depthInTree = ownerOfThisOrg.depth + 1;
        }
      }

      const member: FlatMember = {
        id: memberId,
        organizationId: org.id,
        customerId,
        role,
        title: TITLE_MAP[role] ?? null,
        parentMemberId,
        depth: depthInTree,
      };

      orgMembers.push(member);
      members.push(member);

      if (role === 'OWNER') {
        orgOwnerMemberMap.set(org.id, memberId);
      }

      // ─── Closure rows for this member ──────────────────────────────
      // Self-closure (depth 0)
      closureCounter += 1;
      closures.push({
        id: createSeedId(ORG_CLOSURE_ID_PREFIX, storeSlug, closureCounter),
        ancestorId: memberId,
        descendantId: memberId,
        depth: 0,
      });

      // Walk up the parent chain and create closure rows
      let ancestorId = parentMemberId;
      let closureDepth = 1;
      while (ancestorId) {
        closureCounter += 1;
        closures.push({
          id: createSeedId(ORG_CLOSURE_ID_PREFIX, storeSlug, closureCounter),
          ancestorId,
          descendantId: memberId,
          depth: closureDepth,
        });

        const ancestorMember = members.find((m) => m.id === ancestorId);
        ancestorId = ancestorMember?.parentMemberId ?? null;
        closureDepth += 1;
      }
    }
  }

  return { members, closures };
}

// ─── Main seed function ──────────────────────────────────────────────────────

async function seedOrganizations() {
  const stores = await prisma.store.findMany({
    select: { id: true, slug: true, name: true },
    orderBy: { slug: 'asc' },
  });

  if (stores.length === 0) {
    throw new Error(
      'No stores found. Run `npm run seed:stores` in packages/prisma first.',
    );
  }

  console.log(
    `Starting organization seed with ${ORG_TREE_TEMPLATES.length} root orgs across ${stores.length} stores...`,
  );

  let totalOrgCount = 0;
  let totalMemberCount = 0;
  let totalClosureCount = 0;

  for (const store of stores) {
    // Get customers for this store to assign as members
    const customers = await prisma.customer.findMany({
      where: { storeId: store.id },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    if (customers.length === 0) {
      console.log(`  Skipping ${store.slug} — no customers found.`);
      continue;
    }

    const customerIds = customers.map((c) => c.id);
    const counter = { value: ORG_SEED_BASE };

    // Flatten the tree templates
    const flatOrgs = flattenOrgTree(
      ORG_TREE_TEMPLATES as unknown as OrgTemplate[],
      store.slug,
      null,
      0,
      counter,
    );

    // Assign members from existing customers
    const { members, closures } = assignMembers(flatOrgs, customerIds, store.slug);

    console.log(
      `  ${store.slug}: ${flatOrgs.length} orgs, ${members.length} members, ${closures.length} closures`,
    );

    // 1. Upsert organizations (parents first — sorted by depth)
    const sortedOrgs = [...flatOrgs].sort((a, b) => a.depth - b.depth);

    await prisma.$transaction(
      async (tx) => {
        for (const org of sortedOrgs) {
          const data: Prisma.OrganizationUncheckedCreateInput = {
            id: org.id,
            storeId: store.id,
            name: org.name,
            taxId: org.taxId,
            email: org.email,
            phone: org.phone,
            address: org.address,
            isActive: true,
            parentOrgId: org.parentOrgId,
          };

          await tx.organization.upsert({
            where: { id: org.id },
            create: data,
            update: {
              storeId: data.storeId,
              name: data.name,
              taxId: data.taxId,
              email: data.email,
              phone: data.phone,
              address: data.address,
              isActive: data.isActive,
              parentOrgId: data.parentOrgId,
            },
          });
        }
      },
      { timeout: 30000 },
    );

    // 2. Upsert organization members (parents first — sorted by depth)
    const sortedMembers = [...members].sort((a, b) => a.depth - b.depth);

    await prisma.$transaction(
      async (tx) => {
        for (const member of sortedMembers) {
          const data: Prisma.OrganizationMemberUncheckedCreateInput = {
            id: member.id,
            organizationId: member.organizationId,
            customerId: member.customerId,
            role: member.role,
            title: member.title,
            parentMemberId: member.parentMemberId,
            isActive: true,
          };

          await tx.organizationMember.upsert({
            where: { id: member.id },
            create: data,
            update: {
              organizationId: data.organizationId,
              customerId: data.customerId,
              role: data.role,
              title: data.title,
              parentMemberId: data.parentMemberId,
              isActive: data.isActive,
            },
          });
        }
      },
      { timeout: 30000 },
    );

    // 3. Upsert closure table rows
    await prisma.$transaction(
      async (tx) => {
        for (const closure of closures) {
          const data: Prisma.OrgMemberClosureUncheckedCreateInput = {
            id: closure.id,
            ancestorId: closure.ancestorId,
            descendantId: closure.descendantId,
            depth: closure.depth,
          };

          await tx.orgMemberClosure.upsert({
            where: { id: closure.id },
            create: data,
            update: {
              ancestorId: data.ancestorId,
              descendantId: data.descendantId,
              depth: data.depth,
            },
          });
        }
      },
      { timeout: 30000 },
    );

    totalOrgCount += flatOrgs.length;
    totalMemberCount += members.length;
    totalClosureCount += closures.length;
  }

  console.log('Organization seed completed.');
  console.log(`Organizations: ${totalOrgCount}`);
  console.log(`Members: ${totalMemberCount}`);
  console.log(`Closure rows: ${totalClosureCount}`);
}

seedOrganizations()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
