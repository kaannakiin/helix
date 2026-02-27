'use client';

import { getGroupedNavbarItems } from '@/core/config/navigation';
import ThemeSwitch from '@/core/ui/components/theme-switch';
import {
  ActionIcon,
  AppShell,
  Kbd,
  NavLink as MantineNavLink,
  ScrollArea,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { spotlight } from '@mantine/spotlight';
import { Bell, PanelLeftClose, PanelLeftOpen, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { AdminLogo } from './admin-logo';
import { AdminUserMenu } from './admin-user-menu';
import { NavLinkItem } from './nav-link-item';

interface AdminNavbarProps {
  collapsed: boolean;
  mobileOpened: boolean;
  onNavigate?: () => void;
  onMobileToggle?: () => void;
  onDesktopToggle?: () => void;
}

export function AdminNavbar({
  collapsed,
  mobileOpened,
  onNavigate,
  onMobileToggle,
  onDesktopToggle,
}: AdminNavbarProps) {
  const t = useTranslations('common.nav');
  const pathname = usePathname();
  const groupedItems = getGroupedNavbarItems();

  return (
    <AppShell.Navbar className="flex flex-col">
      <AppShell.Section
        visibleFrom="sm"
        className={`flex items-center relative ${
          collapsed ? 'justify-center p-4' : 'justify-between px-4 py-[14px]'
        }`}
        style={{
          borderBottom: '1px solid var(--mantine-color-default-border)',
        }}
      >
        <AdminLogo collapsed={collapsed} />
        {onDesktopToggle && !collapsed && (
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={onDesktopToggle}
            className="hidden sm:flex transition-transform hover:bg-gray-100 dark:hover:bg-dark-6"
            aria-label="Toggle navigation"
          >
            <PanelLeftClose size={20} />
          </ActionIcon>
        )}
      </AppShell.Section>

      <AppShell.Section className={collapsed ? 'p-2' : 'px-3 pt-3 pb-1'}>
        {!collapsed ? (
          <TextInput
            leftSection={<Search size={16} />}
            rightSection={
              <div className="flex items-center gap-0.5">
                <Kbd size="xs">⌘</Kbd>
                <Kbd size="xs">K</Kbd>
              </div>
            }
            rightSectionWidth={52}
            placeholder={t('search_placeholder')}
            readOnly
            onClick={() => spotlight.open()}
            styles={{
              input: { cursor: 'pointer' },
            }}
            size="sm"
            variant="filled"
          />
        ) : (
          <div className="flex flex-col items-center gap-1">
            <Tooltip label={t('search_placeholder')} position="right" withArrow>
              <ActionIcon
                variant="subtle"
                color="gray"
                size="lg"
                onClick={() => spotlight.open()}
                aria-label={t('search_placeholder')}
              >
                <Search size={20} />
              </ActionIcon>
            </Tooltip>
            {onDesktopToggle && (
              <Tooltip
                label={t('toggle_navigation')}
                position="right"
                withArrow
              >
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="lg"
                  onClick={onDesktopToggle}
                  className="hidden sm:flex"
                  aria-label={t('toggle_navigation')}
                >
                  <PanelLeftOpen size={20} />
                </ActionIcon>
              </Tooltip>
            )}
          </div>
        )}
      </AppShell.Section>

      <AppShell.Section grow component={ScrollArea} className="p-2">
        {Array.from(groupedItems.entries()).map(([groupKey, items]) => {
          const groupTitle = t(`groups.${groupKey}`);

          if (collapsed || groupKey === 'main' || groupKey === 'ungrouped') {
            return (
              <div key={groupKey} className="mb-1">
                {!collapsed &&
                  groupKey !== 'main' &&
                  groupKey !== 'ungrouped' && (
                    <Text
                      size="xs"
                      fw={600}
                      c="dimmed"
                      className="px-3 pt-4 pb-1 uppercase tracking-wider"
                    >
                      {groupTitle}
                    </Text>
                  )}
                {items.map((item) => (
                  <NavLinkItem
                    key={item.key}
                    label={t(item.key)}
                    href={item.href}
                    icon={item.icon}
                    active={
                      pathname === item.href ||
                      (item.href !== '/admin' &&
                        pathname.startsWith(item.href + '/'))
                    }
                    collapsed={collapsed}
                    onClick={onNavigate}
                    children={item.children}
                    isSection={item.isSection}
                  />
                ))}
              </div>
            );
          }

          return (
            <div key={groupKey} className="mb-1">
              <MantineNavLink
                label={groupTitle}
                defaultOpened
                childrenOffset={12}
                className="rounded-md font-semibold text-sm mb-1"
              >
                {items.map((item) => (
                  <NavLinkItem
                    key={item.key}
                    label={t(item.key)}
                    href={item.href}
                    icon={item.icon}
                    active={
                      pathname === item.href ||
                      (item.href !== '/admin' &&
                        pathname.startsWith(item.href + '/'))
                    }
                    collapsed={collapsed}
                    onClick={onNavigate}
                    children={item.children}
                    isSection={item.isSection}
                  />
                ))}
              </MantineNavLink>
            </div>
          );
        })}
      </AppShell.Section>

      <AppShell.Section
        className="p-3 flex flex-col gap-2"
        style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}
      >
        <div
          className={`flex items-center ${
            collapsed ? 'flex-col gap-2' : 'justify-end gap-1 px-1'
          } mb-2`}
        >
          <ActionIcon variant="subtle" color="gray" aria-label="Notifications">
            <Bell size={20} />
          </ActionIcon>
          <ThemeSwitch />
        </div>

        <AdminUserMenu collapsed={collapsed} />
      </AppShell.Section>
    </AppShell.Navbar>
  );
}
