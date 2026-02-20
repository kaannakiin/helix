'use client';

import { useUserDetail } from '@/core/hooks/useAdminUsers';
import {
  Avatar,
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
  Calendar,
  Clock,
  Fingerprint,
  Globe,
  LogIn,
  Mail,
  MailCheck,
  Monitor,
  Phone,
  PhoneCall,
  Shield,
  ShieldCheck,
  User,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'red',
  MODERATOR: 'orange',
  USER: 'blue',
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'green',
  SUSPENDED: 'yellow',
  BANNED: 'red',
  DEACTIVATED: 'gray',
};

function getInitials(name?: string | null, surname?: string | null): string {
  const first = name?.charAt(0)?.toUpperCase() ?? '';
  const last = surname?.charAt(0)?.toUpperCase() ?? '';
  return first + last || '?';
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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text size="sm" fw={600} tt="uppercase" c="dimmed" lts={0.5}>
      {children}
    </Text>
  );
}

function BooleanBadge({
  value,
  yesLabel,
  noLabel,
}: {
  value: boolean;
  yesLabel: string;
  noLabel: string;
}) {
  return (
    <Badge size="sm" variant="dot" color={value ? 'green' : 'gray'}>
      {value ? yesLabel : noLabel}
    </Badge>
  );
}

export default function CustomerDetailPage() {
  const t = useTranslations('common.admin.customers');
  const tTable = useTranslations('common.admin.customers.table');
  const tDetail = useTranslations('common.admin.customers.detail');
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { data: user, isLoading, error } = useUserDetail(params.id);

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
        <SimpleGrid cols={{ base: 1, sm: 3 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height={80} radius="md" />
          ))}
        </SimpleGrid>
        <Skeleton height={300} radius="md" />
      </Stack>
    );
  }

  if (error || !user) {
    return (
      <Stack gap="lg" align="center" justify="center" py={80}>
        <ThemeIcon size={64} radius="xl" variant="light" color="gray">
          <User size={32} />
        </ThemeIcon>
        <Title order={3} c="dimmed">
          {t('notFound')}
        </Title>
        <Button
          variant="subtle"
          leftSection={<ArrowLeft size={16} />}
          onClick={() => router.push('/admin/customers')}
        >
          {tDetail('backToList')}
        </Button>
      </Stack>
    );
  }

  const fullName = `${user.name ?? ''} ${user.surname ?? ''}`.trim();

  return (
    <Stack gap="lg">
      {/* Header */}
      <Group justify="space-between" align="flex-start">
        <Group gap="lg">
          <Avatar
            size={64}
            radius="xl"
            color={ROLE_COLORS[user.role] ?? 'blue'}
          >
            {getInitials(user.name, user.surname)}
          </Avatar>
          <div>
            <Group gap="sm" align="center">
              <Title order={2}>{fullName || '—'}</Title>
              <Badge color={ROLE_COLORS[user.role]} variant="filled" size="sm">
                {user.role}
              </Badge>
              <Badge
                color={STATUS_COLORS[user.status]}
                variant="light"
                size="sm"
              >
                {user.status}
              </Badge>
            </Group>
            <Group gap="xs" mt={4}>
              <Text size="sm" c="dimmed">
                {tDetail('memberSince')}{' '}
                {new Date(user.createdAt).toLocaleDateString()}
              </Text>
              <Text size="sm" c="dimmed">
                {'·'}
              </Text>
              <Text size="sm" c="dimmed">
                {tDetail('lastSeen')}{' '}
                {user.lastLoginAt
                  ? new Date(user.lastLoginAt).toLocaleDateString()
                  : tDetail('neverLoggedIn')}
              </Text>
            </Group>
          </div>
        </Group>
        <Button
          variant="default"
          leftSection={<ArrowLeft size={16} />}
          onClick={() => router.push('/admin/customers')}
        >
          {tDetail('backToList')}
        </Button>
      </Group>

      {/* Stats */}
      <SimpleGrid cols={{ base: 1, sm: 3 }}>
        <StatCard
          icon={<Globe size={22} />}
          label={tDetail('sessions')}
          count={user._count.sessions}
          color="blue"
        />
        <StatCard
          icon={<Monitor size={22} />}
          label={tDetail('devices')}
          count={user._count.devices}
          color="violet"
        />
        <StatCard
          icon={<Clock size={22} />}
          label={tDetail('loginHistory')}
          count={user._count.loginHistory}
          color="teal"
        />
      </SimpleGrid>

      {/* Details */}
      <SimpleGrid cols={{ base: 1, md: 2 }}>
        {/* Contact Information */}
        <Paper p="lg" withBorder radius="md">
          <Stack gap="md">
            <SectionTitle>
              {tDetail('sections.contactInfo')}
            </SectionTitle>
            <Divider />
            <DetailRow icon={<User size={14} />} label={tTable('name')}>
              <Text size="sm" fw={500}>
                {user.name ?? '—'}
              </Text>
            </DetailRow>
            <DetailRow icon={<User size={14} />} label={tTable('surname')}>
              <Text size="sm" fw={500}>
                {user.surname ?? '—'}
              </Text>
            </DetailRow>
            <DetailRow icon={<Mail size={14} />} label={tTable('email')}>
              <Text size="sm" fw={500}>
                {user.email ?? tDetail('notProvided')}
              </Text>
            </DetailRow>
            <DetailRow icon={<Phone size={14} />} label={tTable('phone')}>
              <Text size="sm" fw={500}>
                {user.phone ?? tDetail('notProvided')}
              </Text>
            </DetailRow>
          </Stack>
        </Paper>

        {/* Security */}
        <Paper p="lg" withBorder radius="md">
          <Stack gap="md">
            <SectionTitle>{tDetail('sections.security')}</SectionTitle>
            <Divider />
            <DetailRow
              icon={<MailCheck size={14} />}
              label={tTable('emailVerified')}
            >
              <BooleanBadge
                value={user.emailVerified}
                yesLabel={tDetail('yes')}
                noLabel={tDetail('no')}
              />
            </DetailRow>
            <DetailRow
              icon={<PhoneCall size={14} />}
              label={tTable('phoneVerified')}
            >
              <BooleanBadge
                value={user.phoneVerified}
                yesLabel={tDetail('yes')}
                noLabel={tDetail('no')}
              />
            </DetailRow>
            <DetailRow
              icon={<ShieldCheck size={14} />}
              label={tTable('twoFactorEnabled')}
            >
              <BooleanBadge
                value={user.twoFactorEnabled}
                yesLabel={tDetail('yes')}
                noLabel={tDetail('no')}
              />
            </DetailRow>
            <DetailRow icon={<Shield size={14} />} label={tTable('role')}>
              <Badge color={ROLE_COLORS[user.role]} size="sm">
                {user.role}
              </Badge>
            </DetailRow>
            <DetailRow
              icon={<Fingerprint size={14} />}
              label={tTable('status')}
            >
              <Badge
                color={STATUS_COLORS[user.status]}
                variant="light"
                size="sm"
              >
                {user.status}
              </Badge>
            </DetailRow>
          </Stack>
        </Paper>
      </SimpleGrid>

      {/* Activity */}
      <Paper p="lg" withBorder radius="md">
        <Stack gap="md">
          <SectionTitle>{tDetail('sections.activity')}</SectionTitle>
          <Divider />
          <SimpleGrid cols={{ base: 1, sm: 3 }}>
            <DetailRow icon={<LogIn size={14} />} label={tTable('lastLoginAt')}>
              <Text size="sm" fw={500}>
                {user.lastLoginAt
                  ? new Date(user.lastLoginAt).toLocaleString()
                  : '—'}
              </Text>
            </DetailRow>
            <DetailRow
              icon={<Fingerprint size={14} />}
              label={tTable('loginCount')}
            >
              <Text size="sm" fw={500}>
                {user.loginCount.toLocaleString()}
              </Text>
            </DetailRow>
            <DetailRow
              icon={<Calendar size={14} />}
              label={tTable('createdAt')}
            >
              <Text size="sm" fw={500}>
                {new Date(user.createdAt).toLocaleString()}
              </Text>
            </DetailRow>
          </SimpleGrid>
        </Stack>
      </Paper>
    </Stack>
  );
}
