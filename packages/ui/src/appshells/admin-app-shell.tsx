import { AppShell } from "@mantine/core";
import { useHeadroom } from "@mantine/hooks";
import { ReactNode } from "react";

interface AdminAppShellProps {
  children: ReactNode;
}

const AdminAppShell = ({ children }: AdminAppShellProps) => {
  const pinned = useHeadroom({ fixedAt: 120 });

  return (
    <AppShell
      header={{ height: 60, collapsed: !pinned, offset: false }}
      padding="md"
    >
      <AppShell.Header p="md">
        Header is hidden when scrolled down, visible when scrolling up
      </AppShell.Header>

      <AppShell.Main pt="var(--app-shell-header-height)">
        {children}
      </AppShell.Main>
    </AppShell>
  );
};

export default AdminAppShell;
