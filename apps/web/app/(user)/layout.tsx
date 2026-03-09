'use client';
import { AppShell } from '@mantine/core';
import { useHeadroom } from '@mantine/hooks';

interface UserLayoutProps {
  children: React.ReactNode;
}
const UserLayout = ({ children }: UserLayoutProps) => {
  const pinned = useHeadroom({ fixedAt: 120 });

  return (
    <AppShell
      header={{ height: 60, collapsed: !pinned, offset: false }}
      padding="md"
    >
      <AppShell.Header p="md">
        Header is hidden when scrolled down, visible when scrolling up
      </AppShell.Header>

      <AppShell.Main
        pt="var(--app-shell-header-height)"
        className="min-h-[calc(100vh-var(--app-shell-header-height))] flex flex-col"
      >
        {children}
      </AppShell.Main>
    </AppShell>
  );
};

export default UserLayout;
