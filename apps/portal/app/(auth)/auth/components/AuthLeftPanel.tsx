'use client';

import { Button, Divider, Group, Stack, Text } from '@mantine/core';
import { Hexagon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import LoginForm from './LoginForm';

const AuthLeftPanel = () => {
  const t = useTranslations('frontend.auth');

  return (
    <div className="flex flex-col min-h-screen w-1/2 shrink-0 p-12 bg-white dark:bg-[#0f1117]">
      <Group gap="xs">
        <Hexagon size={26} color="var(--mantine-color-primary-4)" />
        <Text fw={700} size="lg" className="text-gray-900 dark:text-white">
          Helix
        </Text>
      </Group>

      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-[420px]">
          <Stack gap="xs" mb="xl">
            <Text size="xl" fw={700} className="text-gray-900 dark:text-white">
              {t('sign_in_title')}
            </Text>
          </Stack>

          <LoginForm />

          <Divider
            label={t('or_continue_with')}
            labelPosition="center"
            my="xl"
          />

          <Group grow gap="sm">
            <Button
              variant="default"
              leftSection={
                <Image
                  src="/icons/google.svg"
                  alt="Google"
                  width={16}
                  height={16}
                  className="dark:invert"
                />
              }
            >
              Google
            </Button>
            <Button
              variant="default"
              leftSection={
                <Image
                  src="/icons/github.svg"
                  alt="GitHub"
                  width={16}
                  height={16}
                  className="dark:invert"
                />
              }
            >
              GitHub
            </Button>
          </Group>
        </div>
      </div>
    </div>
  );
};

export default AuthLeftPanel;
