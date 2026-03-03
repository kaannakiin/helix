'use client';

import { useLogin } from '@/core/hooks/useAuth';
import { useAuthStore } from '@/core/stores/auth.store';
import { useTranslatedZodResolver } from '@/core/hooks/useTranslatedZodResolver';
import {
  Anchor,
  Button,
  Checkbox,
  Group,
  PasswordInput,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import {
  LoginSchema,
  type LoginSchemaInputType,
  type LoginSchemaOutputType,
} from '@org/schemas/auth';
import { PhoneInput } from '@org/ui/inputs/phone-input';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
interface LoginFormProps {
  onSwitch: () => void;
}

const LoginForm = ({ onSwitch }: LoginFormProps) => {
  const t = useTranslations('frontend.auth');
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const { mutateAsync: login, isPending, error } = useLogin();

  const [loginType, setLoginType] = useState<'email' | 'phone'>('email');
  const resolver = useTranslatedZodResolver(LoginSchema);

  const { control, handleSubmit, reset } = useForm<LoginSchemaInputType>({
    resolver,
    defaultValues: {
      type: 'email',
      email: '',
      password: '',
    },
  });

  const handleTypeChange = (value: string) => {
    const type = value as 'email' | 'phone';
    setLoginType(type);
    if (type === 'email') {
      reset({ type: 'email', email: '', password: '' });
    } else {
      reset({ type: 'phone', phone: '', password: '' });
    }
  };

  const onSubmit = async (data: LoginSchemaInputType) => {
    await login(data as LoginSchemaOutputType, {
      onSuccess: (res) => {
        setUser(res.user);
        router.push('/');
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack gap="md">
        <SegmentedControl
          value={loginType}
          onChange={handleTypeChange}
          data={[
            { label: t('email_tab'), value: 'email' },
            { label: t('phone_tab'), value: 'phone' },
          ]}
          fullWidth
        />

        {loginType === 'email' ? (
          <Controller
            control={control}
            name="email"
            render={({ field, fieldState }) => (
              <TextInput
                {...field}
                label={t('email_label')}
                type="email"
                error={fieldState.error?.message}
              />
            )}
          />
        ) : (
          <Controller
            control={control}
            name="phone"
            render={({ field, fieldState }) => (
              <PhoneInput
                {...field}
                label={t('phone_label')}
                size="sm"
                onChange={(val) => field.onChange(val)}
                error={fieldState.error?.message}
              />
            )}
          />
        )}

        <Controller
          control={control}
          name="password"
          render={({ field, fieldState }) => (
            <PasswordInput
              {...field}
              label={t('password_label')}
              error={fieldState.error?.message}
            />
          )}
        />

        <Group justify="space-between">
          <Checkbox
            label={t('remember_me')}
            styles={{ label: { cursor: 'pointer' } }}
          />
          <Anchor size="sm" c="primary.4" href="#">
            {t('forgot_password')}
          </Anchor>
        </Group>

        {error && (
          <Text c="red.4" size="sm">
            {error.message}
          </Text>
        )}

        <Button
          type="submit"
          loading={isPending}
          fullWidth
          color="primary"
          variant="filled"
          size="md"
        >
          {t('sign_in_button')}
        </Button>

        <Text ta="center" size="sm">
          {t('no_account')}
          <Anchor
            component="button"
            type="button"
            size="sm"
            c="primary.4"
            fw={500}
            onClick={onSwitch}
          >
            {t('register_link')}
          </Anchor>
        </Text>
      </Stack>
    </form>
  );
};

export default LoginForm;
