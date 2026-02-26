'use client';

import type { NavItem } from '@/core/config/navigation';
import { NavLink, Tooltip } from '@mantine/core';
import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface NavLinkItemProps {
  label: string;
  href: string;
  icon: LucideIcon;
  active?: boolean;
  collapsed?: boolean;
  onClick?: () => void;
  children?: NavItem[];
  depth?: number;
}

export function NavLinkItem({
  label,
  href,
  icon: Icon,
  active = false,
  collapsed = false,
  onClick,
  children,
  depth = 0,
}: NavLinkItemProps) {
  const pathname = usePathname();
  const t = useTranslations('common.nav');

  const hasChildren = children && children.length > 0;

  const isChildActive =
    hasChildren &&
    children.some(
      (child) =>
        pathname === child.href ||
        !!(child.href && pathname.startsWith(child.href + '/'))
    );

  const [opened, setOpened] = useState(!!isChildActive);

  const renderChildren = () => {
    if (collapsed || !hasChildren) return null;

    const selfLink = (
      <NavLinkItem
        key="__self"
        label={label}
        href={href}
        icon={Icon}
        active={pathname === href}
        collapsed={false}
        onClick={onClick}
        depth={depth + 1}
      />
    );

    const childLinks = children.map((child) => {
      const childActive = !!(
        pathname === child.href ||
        (child.href !== '/admin' &&
          child.href &&
          pathname.startsWith(child.href + '/'))
      );
      return (
        <NavLinkItem
          key={child.key}
          label={t(child.key)}
          href={child.href}
          icon={child.icon}
          active={childActive}
          collapsed={false}
          onClick={onClick}
          children={child.children}
          depth={depth + 1}
        />
      );
    });

    return [selfLink, ...childLinks];
  };

  const navLinkProps =
    hasChildren && !collapsed
      ? {
          opened,
          onChange: setOpened,
          active: (active || isChildActive) && !opened,
        }
      : {
          renderRoot: (props: React.ComponentPropsWithRef<'a'>) => (
            <Link {...props} href={href} onClick={onClick} />
          ),
          href,
          active: collapsed ? active || isChildActive : active,
        };

  const link = (
    <NavLink
      {...navLinkProps}
      label={collapsed ? undefined : label}
      leftSection={<Icon size={20} />}
      childrenOffset={depth > 0 ? 12 : 16}
      styles={{
        root: {
          borderRadius: 'var(--mantine-radius-md)',
          ...(collapsed && { justifyContent: 'center', padding: '8px' }),
        },
        section: collapsed ? { marginInlineEnd: 0 } : undefined,
        body: collapsed ? { display: 'none' } : undefined,
        chevron: collapsed ? { display: 'none' } : undefined,
      }}
    >
      {renderChildren()}
    </NavLink>
  );

  if (collapsed) {
    return (
      <Tooltip label={label} position="right" withArrow>
        {link}
      </Tooltip>
    );
  }

  return link;
}
