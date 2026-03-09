'use client';

import { ActionIcon, useMantineColorScheme } from '@mantine/core';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function ThemeSwitch() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const mounted = useRef(false);
  const [, forceUpdate] = useState({});

  useEffect(() => {
    mounted.current = true;
    forceUpdate({});
  }, []);

  return (
    <ActionIcon
      variant="subtle"
      color="gray"
      onClick={() => toggleColorScheme()}
      aria-label="Toggle color scheme"
    >
      {!mounted.current ? (
        <Sun size={20} className="opacity-0" />
      ) : colorScheme === 'dark' ? (
        <Sun size={20} />
      ) : (
        <Moon size={20} />
      )}
    </ActionIcon>
  );
}
