'use client';

import { ActionIcon, useMantineColorScheme } from '@mantine/core';
import { Moon, Sun } from 'lucide-react';

export default function ThemeSwitch() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  return (
    <ActionIcon
      variant="subtle"
      color="gray"
      onClick={toggleColorScheme}
      aria-label="Toggle color scheme"
    >
      {colorScheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
    </ActionIcon>
  );
}
