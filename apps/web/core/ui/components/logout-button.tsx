'use client';

import { useLogout } from '@/core/hooks/useAuth';
import { Button } from '@mantine/core';
import { LogOut } from 'lucide-react';

const LogoutButton = () => {
  const { mutate: logout, isPending } = useLogout();

  return (
    <Button
      variant="subtle"
      color="red"
      leftSection={<LogOut size={16} />}
      loading={isPending}
      onClick={() => logout()}
    >
      Logout
    </Button>
  );
};

export default LogoutButton;
