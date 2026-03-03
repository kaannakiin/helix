'use client';

import { useAuthStore } from '@/core/stores/auth.store';
import { Avatar, Group, Menu, Text, UnstyledButton } from '@mantine/core';
import { LogOut, User } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface AdminUserMenuProps {
  collapsed?: boolean;
}

export function AdminUserMenu({ collapsed = false }: AdminUserMenuProps) {
  const t = useTranslations('frontend.nav');
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const initials = user
    ? `${user.name.charAt(0)}${user.surname.charAt(0)}`.toUpperCase()
    : '??';

  return (
    <Menu id="admin-user-menu" position="top-start" withArrow shadow="md">
      <Menu.Target>
        <UnstyledButton className="w-full rounded-md p-2 hover:bg-(--mantine-color-gray-1) dark:hover:bg-(--mantine-color-dark-5) transition-colors">
          <Group gap="sm" wrap="nowrap">
            <Avatar color="primary" radius="xl" size={collapsed ? 'sm' : 'md'}>
              {initials}
            </Avatar>
            {!collapsed && user && (
              <div className="flex-1 min-w-0">
                <Text size="sm" fw={500} truncate="end">
                  {user.name} {user.surname}
                </Text>
                <Text size="xs" truncate="end" c="dimmed">
                  {user.email ?? user.phone}
                </Text>
              </div>
            )}
          </Group>
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Item leftSection={<User size={16} />}>{t('profile')}</Menu.Item>
        <Menu.Divider />
        <Menu.Item
          color="red"
          leftSection={<LogOut size={16} />}
          onClick={logout}
        >
          {t('logout')}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
