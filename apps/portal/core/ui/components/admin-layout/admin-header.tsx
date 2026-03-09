'use client';

import ThemeSwitch from '@/core/ui/components/theme-switch';
import {
  ActionIcon,
  AppShell,
  Burger,
  Group,
  Kbd,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { spotlight } from '@mantine/spotlight';
import { Bell, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface AdminHeaderProps {
  mobileOpened: boolean;
  desktopCollapsed: boolean;
  onMobileToggle: () => void;
  onDesktopToggle: () => void;
}

export function AdminHeader({
  mobileOpened,
  desktopCollapsed,
  onMobileToggle,
  onDesktopToggle,
}: AdminHeaderProps) {
  const t = useTranslations('frontend.nav');

  return (
    <AppShell.Header className="flex items-center justify-between px-4">
      <Group gap="sm">
        <Burger
          opened={mobileOpened}
          onClick={onMobileToggle}
          hiddenFrom="sm"
          size="sm"
        />
      </Group>

      <Group gap="sm">
        <TextInput
          placeholder={t('search_placeholder')}
          leftSection={<Search size={16} />}
          rightSectionWidth={60}
          rightSection={
            <>
              <Kbd size="xs" className="">
                CTRL + K
              </Kbd>
            </>
          }
          onClick={() => spotlight.open()}
          visibleFrom="sm"
          styles={{
            input: { cursor: 'pointer' },
          }}
          w={260}
        />

        <Tooltip label={t('search_placeholder')}>
          <ActionIcon
            variant="subtle"
            onClick={() => spotlight.open()}
            hiddenFrom="sm"
            color="gray"
          >
            <Search size={20} />
          </ActionIcon>
        </Tooltip>

        <Tooltip label="Notifications">
          <ActionIcon variant="subtle" color="gray">
            <Bell size={20} />
          </ActionIcon>
        </Tooltip>

        <ThemeSwitch />
      </Group>
    </AppShell.Header>
  );
}
