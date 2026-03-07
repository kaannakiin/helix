'use client';

import { Badge } from '@mantine/core';
import { useTranslations } from 'next-intl';

const STATUS_CONFIG: Record<string, { color: string; key: string }> = {
  ACTIVE: { color: 'green', key: 'live' },
  READY: { color: 'green', key: 'live' },
  VERIFIED: { color: 'green', key: 'verified' },
  PENDING_OWNERSHIP: { color: 'yellow', key: 'verificationNeeded' },
  PENDING_ROUTING: { color: 'yellow', key: 'settingUp' },
  PENDING: { color: 'yellow', key: 'settingUp' },
  FAILED: { color: 'red', key: 'needsAttention' },
  DISABLED: { color: 'gray', key: 'disabled' },
  ARCHIVED: { color: 'gray', key: 'disabled' },
  SKIPPED: { color: 'gray', key: 'disabled' },
};

interface DomainStatusBadgeProps {
  status: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export function DomainStatusBadge({
  status,
  size = 'sm',
}: DomainStatusBadgeProps) {
  const t = useTranslations('frontend.admin.stores.domains.status');
  const config = STATUS_CONFIG[status] ?? { color: 'gray', key: 'disabled' };

  return (
    <Badge color={config.color} variant="light" size={size}>
      {t(config.key)}
    </Badge>
  );
}
