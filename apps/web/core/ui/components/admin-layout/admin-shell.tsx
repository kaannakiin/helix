'use client';

import { AppShell, Burger, Group } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { useEffect, useState } from 'react';

import { AdminLogo } from './admin-logo';
import { AdminNavbar } from './admin-navbar';
import { AdminSpotlight } from './admin-spotlight';

interface AdminShellProps {
  children: React.ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [mobileOpened, { toggle: toggleMobile, close: closeMobile }] =
    useDisclosure(false);
  const [desktopCollapsed, { toggle: toggleDesktop }] = useDisclosure(false);

  const isTablet = useMediaQuery(
    '(min-width: 768px) and (max-width: 1024px)',
    false,
    { getInitialValueInEffect: true }
  );
  const isMobile = useMediaQuery('(max-width: 767px)', false, {
    getInitialValueInEffect: true,
  });

  const effectiveCollapsed = mounted
    ? isTablet
      ? true
      : desktopCollapsed
    : desktopCollapsed;
  const navbarWidth = mounted
    ? effectiveCollapsed
      ? 80
      : 260
    : desktopCollapsed
    ? 80
    : 260;

  return (
    <>
      <AppShell
        id="admin-app-shell"
        header={{ height: 60, collapsed: mounted ? !isMobile : true }}
        navbar={{
          width: navbarWidth,
          breakpoint: 'sm',
          collapsed: { mobile: !mobileOpened },
        }}
        padding="md"
        transitionDuration={200}
      >
        <AppShell.Header hiddenFrom="sm">
          <Group h="100%" px="md">
            <Burger opened={mobileOpened} onClick={toggleMobile} size="sm" />
            <AdminLogo collapsed={false} />
          </Group>
        </AppShell.Header>

        <AdminNavbar
          collapsed={effectiveCollapsed}
          onMobileToggle={toggleMobile}
          onNavigate={closeMobile}
          onDesktopToggle={toggleDesktop}
          mobileOpened={mobileOpened}
        />
        <AppShell.Main className="flex flex-col min-h-[calc(100vh - var(--app-shell-header-offset, 0px) - var(--mantine-spacing-md) * 2)] h-full">
          {children}
        </AppShell.Main>
      </AppShell>
      <AdminSpotlight />
    </>
  );
}
