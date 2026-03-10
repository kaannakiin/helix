'use client';

import { useCustomerDetail } from '@/core/hooks/useAdminCustomers';
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

const ACCOUNT_TYPE_COLORS: Record<string, string> = {
  PERSONAL: 'blue',
  BUSINESS: 'teal',
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
  const t = useTranslations('frontend.admin.customers');
  const tTable = useTranslations('frontend.admin.customers.table');
  const tDetail = useTranslations('frontend.admin.customers.detail');
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { data: customer, isLoading, error } = useCustomerDetail(params.id);

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

  if (error || !customer) {
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
          onClick={() => router.push('/customers')}
        >
          {tDetail('backToList')}
        </Button>
      </Stack>
    );
  }

  const fullName = `${customer.name ?? ''} ${customer.surname ?? ''}`.trim();

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-start">
        <Group gap="lg">
          <Avatar
            size={64}
            radius="xl"
            color={ACCOUNT_TYPE_COLORS[customer.accountType] ?? 'blue'}
          >
            {getInitials(customer.name, customer.surname)}
          </Avatar>
          <div>
            <Group gap="sm" align="center">
              <Title order={2}>{fullName || '—'}</Title>
              <Badge
                color={ACCOUNT_TYPE_COLORS[customer.accountType]}
                variant="filled"
                size="sm"
              >
                {customer.accountType}
              </Badge>
              <Badge
                color={STATUS_COLORS[customer.status]}
                variant="light"
                size="sm"
              >
                {customer.status}
              </Badge>
            </Group>
            <Group gap="xs" mt={4}>
              <Text size="sm" c="dimmed">
                {tDetail('memberSince')}{' '}
                {new Date(customer.createdAt).toLocaleDateString()}
              </Text>
              <Text size="sm" c="dimmed">
                {'·'}
              </Text>
              <Text size="sm" c="dimmed">
                {tDetail('lastSeen')}{' '}
                {customer.lastLoginAt
                  ? new Date(customer.lastLoginAt).toLocaleDateString()
                  : tDetail('neverLoggedIn')}
              </Text>
            </Group>
          </div>
        </Group>
        <Button
          variant="default"
          leftSection={<ArrowLeft size={16} />}
          onClick={() => router.push('/customers')}
        >
          {tDetail('backToList')}
        </Button>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <StatCard
          icon={<Globe size={22} />}
          label={tDetail('sessions')}
          count={customer._count.sessions}
          color="blue"
        />
        <StatCard
          icon={<Monitor size={22} />}
          label={tDetail('devices')}
          count={customer._count.devices}
          color="violet"
        />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, md: 2 }}>
        <Paper p="lg" withBorder radius="md">
          <Stack gap="md">
            <SectionTitle>{tDetail('sections.contactInfo')}</SectionTitle>
            <Divider />
            <DetailRow icon={<User size={14} />} label={tTable('name')}>
              <Text size="sm" fw={500}>
                {customer.name ?? '—'}
              </Text>
            </DetailRow>
            <DetailRow icon={<User size={14} />} label={tTable('surname')}>
              <Text size="sm" fw={500}>
                {customer.surname ?? '—'}
              </Text>
            </DetailRow>
            <DetailRow icon={<Mail size={14} />} label={tTable('email')}>
              <Text size="sm" fw={500}>
                {customer.email ?? tDetail('notProvided')}
              </Text>
            </DetailRow>
            <DetailRow icon={<Phone size={14} />} label={tTable('phone')}>
              <Text size="sm" fw={500}>
                {customer.phone ?? tDetail('notProvided')}
              </Text>
            </DetailRow>
          </Stack>
        </Paper>

        <Paper p="lg" withBorder radius="md">
          <Stack gap="md">
            <SectionTitle>{tDetail('sections.security')}</SectionTitle>
            <Divider />
            <DetailRow
              icon={<MailCheck size={14} />}
              label={tTable('emailVerified')}
            >
              <BooleanBadge
                value={customer.emailVerified}
                yesLabel={tDetail('yes')}
                noLabel={tDetail('no')}
              />
            </DetailRow>
            <DetailRow
              icon={<PhoneCall size={14} />}
              label={tTable('phoneVerified')}
            >
              <BooleanBadge
                value={customer.phoneVerified}
                yesLabel={tDetail('yes')}
                noLabel={tDetail('no')}
              />
            </DetailRow>
            <DetailRow
              icon={<ShieldCheck size={14} />}
              label={tTable('twoFactorEnabled')}
            >
              <BooleanBadge
                value={customer.twoFactorEnabled}
                yesLabel={tDetail('yes')}
                noLabel={tDetail('no')}
              />
            </DetailRow>
            <DetailRow
              icon={<Shield size={14} />}
              label={tTable('accountType')}
            >
              <Badge
                color={ACCOUNT_TYPE_COLORS[customer.accountType]}
                size="sm"
              >
                {customer.accountType}
              </Badge>
            </DetailRow>
            <DetailRow
              icon={<Fingerprint size={14} />}
              label={tTable('status')}
            >
              <Badge
                color={STATUS_COLORS[customer.status]}
                variant="light"
                size="sm"
              >
                {customer.status}
              </Badge>
            </DetailRow>
          </Stack>
        </Paper>
      </SimpleGrid>

      <Paper p="lg" withBorder radius="md">
        <Stack gap="md">
          <SectionTitle>{tDetail('sections.activity')}</SectionTitle>
          <Divider />
          <SimpleGrid cols={{ base: 1, sm: 3 }}>
            <DetailRow icon={<LogIn size={14} />} label={tTable('lastLoginAt')}>
              <Text size="sm" fw={500}>
                {customer.lastLoginAt
                  ? new Date(customer.lastLoginAt).toLocaleString()
                  : '—'}
              </Text>
            </DetailRow>
            <DetailRow
              icon={<Fingerprint size={14} />}
              label={tTable('loginCount')}
            >
              <Text size="sm" fw={500}>
                {customer.loginCount.toLocaleString()}
              </Text>
            </DetailRow>
            <DetailRow
              icon={<Calendar size={14} />}
              label={tTable('createdAt')}
            >
              <Text size="sm" fw={500}>
                {new Date(customer.createdAt).toLocaleString()}
              </Text>
            </DetailRow>
          </SimpleGrid>
        </Stack>
      </Paper>
    </Stack>
  );
}
