'use client';

import {
  Code,
  CopyButton,
  Group,
  Paper,
  Stack,
  Text,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { Check, Copy } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface DnsRecord {
  type: string;
  name: string;
  value: string;
}

interface DnsRecordCardProps {
  records: DnsRecord[];
  title?: string;
}

function DnsRecordRow({ record }: { record: DnsRecord }) {
  const t = useTranslations('frontend.admin.stores.domains.wizard.dnsRecord');

  return (
    <Paper withBorder radius="sm" p="sm">
      <Stack gap={4}>
        <Group gap="lg">
          <div style={{ minWidth: 60 }}>
            <Text size="xs" c="dimmed" tt="uppercase">
              {t('type')}
            </Text>
            <Code>{record.type}</Code>
          </div>
          <div style={{ flex: 1 }}>
            <Text size="xs" c="dimmed" tt="uppercase">
              {t('name')}
            </Text>
            <Group gap={4}>
              <Code>{record.name}</Code>
              <CopyButton value={record.name}>
                {({ copied, copy }) => (
                  <Tooltip label={copied ? t('copied') : t('copy')}>
                    <ActionIcon
                      size="xs"
                      variant="subtle"
                      color={copied ? 'green' : 'gray'}
                      onClick={copy}
                    >
                      {copied ? <Check size={12} /> : <Copy size={12} />}
                    </ActionIcon>
                  </Tooltip>
                )}
              </CopyButton>
            </Group>
          </div>
        </Group>
        <div>
          <Text size="xs" c="dimmed" tt="uppercase">
            {t('value')}
          </Text>
          <Group gap={4}>
            <Code style={{ wordBreak: 'break-all' }}>{record.value}</Code>
            <CopyButton value={record.value}>
              {({ copied, copy }) => (
                <Tooltip label={copied ? t('copied') : t('copy')}>
                  <ActionIcon
                    size="xs"
                    variant="subtle"
                    color={copied ? 'green' : 'gray'}
                    onClick={copy}
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>
          </Group>
        </div>
      </Stack>
    </Paper>
  );
}

export function DnsRecordCard({ records, title }: DnsRecordCardProps) {
  return (
    <Stack gap="sm">
      {title && (
        <Text size="sm" fw={500}>
          {title}
        </Text>
      )}
      {records.map((record, i) => (
        <DnsRecordRow key={`${record.type}-${record.name}-${i}`} record={record} />
      ))}
    </Stack>
  );
}
