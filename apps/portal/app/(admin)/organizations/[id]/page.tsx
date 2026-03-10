'use client';

import { useOrganizationDetail } from '@/core/hooks/useAdminOrganizations';
import {
  Badge,
  Button,
  Divider,
  Group,
  Paper,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Mail,
  MapPin,
  Phone,
  Receipt,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Group gap="sm" wrap="nowrap">
      <ThemeIcon size="sm" variant="transparent" c="dimmed">
        {icon}
      </ThemeIcon>
      <Text size="sm" c="dimmed" w={140} style={{ flexShrink: 0 }}>
        {label}
      </Text>
      <div style={{ flex: 1 }}>{children}</div>
    </Group>
  );
}

function StatCard({
  icon,
  label,
  count,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  color: string;
}) {
  return (
    <Paper p="lg" withBorder radius="md">
      <Group gap="md">
        <ThemeIcon size="xl" radius="md" variant="light" color={color}>
          {icon}
        </ThemeIcon>
        <div>
          <Text size="2xl" fw={700} lh={1}>
            {count.toLocaleString()}
          </Text>
          <Text size="sm" c="dimmed" mt={2}>
            {label}
          </Text>
        </div>
      </Group>
    </Paper>
  );
}

export default function OrganizationDetailPage() {
  const t = useTranslations('frontend.admin.organizations');
  const tTable = useTranslations('frontend.admin.organizations.table');
  const tDetail = useTranslations('frontend.admin.organizations.detail');
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const {
    data: organization,
    isLoading,
    error,
  } = useOrganizationDetail(params.id);

  if (isLoading) {
    return (
      <Stack gap="lg">
        <Group gap="md">
          <Skeleton circle height={64} />
          <div>
            <Skeleton height={28} width={250} />
            <Skeleton height={16} width={180} mt={8} />
          </div>
        </Group>
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} height={80} radius="md" />
          ))}
        </SimpleGrid>
        <Skeleton height={300} radius="md" />
      </Stack>
    );
  }

  if (error || !organization) {
    return (
      <Stack gap="lg" align="center" justify="center" py={80}>
        <ThemeIcon size={64} radius="xl" variant="light" color="gray">
          <Building2 size={32} />
        </ThemeIcon>
        <Title order={3} c="dimmed">
          {t('notFound')}
        </Title>
        <Button
          variant="subtle"
          leftSection={<ArrowLeft size={16} />}
          onClick={() => router.push('/organizations')}
        >
          {tDetail('backToList')}
        </Button>
      </Stack>
    );
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-start">
        <Group gap="lg">
          <ThemeIcon size={64} radius="xl" variant="light" color="blue">
            <Building2 size={32} />
          </ThemeIcon>
          <div>
            <Group gap="sm" align="center">
              <Title order={2}>{organization.name}</Title>
              <Badge
                color={organization.isActive ? 'green' : 'gray'}
                variant="light"
                size="sm"
              >
                {organization.isActive ? tTable('isActive') : 'Inactive'}
              </Badge>
            </Group>
            <Group gap="xs" mt={4}>
              <Text size="sm" c="dimmed">
                {new Date(organization.createdAt).toLocaleDateString()}
              </Text>
              {organization.parentOrg && (
                <>
                  <Text size="sm" c="dimmed">
                    {'·'}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {tTable('parentOrg')}: {organization.parentOrg.name}
                  </Text>
                </>
              )}
            </Group>
          </div>
        </Group>
        <Button
          variant="default"
          leftSection={<ArrowLeft size={16} />}
          onClick={() => router.push('/organizations')}
        >
          {tDetail('backToList')}
        </Button>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <StatCard
          icon={<Users size={22} />}
          label={tTable('membersCount')}
          count={organization._count.members}
          color="blue"
        />
        <StatCard
          icon={<Building2 size={22} />}
          label={tTable('childOrgsCount')}
          count={organization._count.childOrgs}
          color="violet"
        />
      </SimpleGrid>

      <Paper p="lg" withBorder radius="md">
        <Stack gap="md">
          <Text size="sm" fw={600} tt="uppercase" c="dimmed" lts={0.5}>
            {tDetail('title')}
          </Text>
          <Divider />
          <DetailRow icon={<Building2 size={14} />} label={tTable('name')}>
            <Text size="sm" fw={500}>
              {organization.name}
            </Text>
          </DetailRow>
          <DetailRow icon={<Receipt size={14} />} label={tTable('taxId')}>
            <Text size="sm" fw={500}>
              {organization.taxId ?? '—'}
            </Text>
          </DetailRow>
          <DetailRow icon={<Mail size={14} />} label={tTable('email')}>
            <Text size="sm" fw={500}>
              {organization.email ?? '—'}
            </Text>
          </DetailRow>
          <DetailRow icon={<Phone size={14} />} label={tTable('phone')}>
            <Text size="sm" fw={500}>
              {organization.phone ?? '—'}
            </Text>
          </DetailRow>
          <DetailRow icon={<MapPin size={14} />} label={tTable('address')}>
            <Text size="sm" fw={500}>
              {organization.address ?? '—'}
            </Text>
          </DetailRow>
          <DetailRow icon={<Calendar size={14} />} label={tTable('createdAt')}>
            <Text size="sm" fw={500}>
              {new Date(organization.createdAt).toLocaleString()}
            </Text>
          </DetailRow>
        </Stack>
      </Paper>

      {organization.members.length > 0 && (
        <Paper p="lg" withBorder radius="md">
          <Stack gap="md">
            <Text size="sm" fw={600} tt="uppercase" c="dimmed" lts={0.5}>
              {tTable('membersCount')} ({organization.members.length})
            </Text>
            <Divider />
            {organization.members.map((member) => (
              <Group key={member.id} justify="space-between">
                <div>
                  <Text size="sm" fw={500}>
                    {member.customer.name} {member.customer.surname}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {member.customer.email}
                  </Text>
                </div>
                <Group gap="xs">
                  {member.title && (
                    <Text size="xs" c="dimmed">
                      {member.title}
                    </Text>
                  )}
                  <Badge size="sm" variant="light">
                    {member.role}
                  </Badge>
                </Group>
              </Group>
            ))}
          </Stack>
        </Paper>
      )}

      {organization.childOrgs.length > 0 && (
        <Paper p="lg" withBorder radius="md">
          <Stack gap="md">
            <Text size="sm" fw={600} tt="uppercase" c="dimmed" lts={0.5}>
              {tTable('childOrgsCount')} ({organization.childOrgs.length})
            </Text>
            <Divider />
            {organization.childOrgs.map((child) => (
              <Group key={child.id} justify="space-between">
                <Text
                  size="sm"
                  fw={500}
                  style={{ cursor: 'pointer' }}
                  onClick={() => router.push(`/organizations/${child.id}`)}
                >
                  {child.name}
                </Text>
                <Badge
                  size="sm"
                  variant="light"
                  color={child.isActive ? 'green' : 'gray'}
                >
                  {child.isActive ? tTable('isActive') : 'Inactive'}
                </Badge>
              </Group>
            ))}
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}
