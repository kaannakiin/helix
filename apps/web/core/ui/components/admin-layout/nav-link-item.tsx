'use client';

import { NavLink, Tooltip } from '@mantine/core';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface NavLinkItemProps {
  label: string;
  href: string;
  icon: LucideIcon;
  active?: boolean;
  collapsed?: boolean;
  onClick?: () => void;
}

export function NavLinkItem({
  label,
  href,
  icon: Icon,
  active = false,
  collapsed = false,
  onClick,
}: NavLinkItemProps) {
  const link = (
    <NavLink
      component={Link}
      href={href}
      label={collapsed ? undefined : label}
      leftSection={<Icon size={20} />}
      active={active}
      onClick={onClick}
      styles={{
        root: {
          borderRadius: 'var(--mantine-radius-md)',
        },
      }}
    />
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
