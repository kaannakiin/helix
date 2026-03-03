'use client';

import { useRegister } from '@/core/hooks/useAuth';
import { useTranslatedZodResolver } from '@/core/hooks/useTranslatedZodResolver';
import {
  Anchor,
  Button,
  Group,
  PasswordInput,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import {
  RegisterSchema,
  type RegisterSchemaInputType,
  type RegisterSchemaOutputType,
} from '@org/schemas/auth';
import { PhoneInput } from '@org/ui/inputs/phone-input';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

interface RegisterFormProps {
  onSwitch: () => void;
}

const RegisterForm = ({ onSwitch }: RegisterFormProps) => {
  const t = useTranslations('frontend.auth');
  const { mutateAsync: register, isPending, error } = useRegister();
  const [contactType, setContactType] = useState<'email' | 'phone'>('email');
  const resolver = useTranslatedZodResolver(RegisterSchema);

  const { control, handleSubmit, setValue } = useForm<RegisterSchemaInputType>({
    resolver,
    defaultValues: {
      name: '',
      surname: '',
      email: '',
      phone: '',
      password: '',
      checkPassword: '',
    },
  });

  const handleContactTypeChange = (value: string) => {
    const type = value as 'email' | 'phone';
    setContactType(type);
    if (type === 'email') {
      setValue('phone', '');
    } else {
      setValue('email', '');
    }
  };

  const onSubmit = async (data: RegisterSchemaInputType) => {
    await register(data as RegisterSchemaOutputType, {
      onSuccess: () => {
        onSwitch();
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack gap="md">
        <Group grow>
          <Controller
            control={control}
            name="name"
            render={({ field, fieldState }) => (
              <TextInput
                {...field}
                label={t('first_name_label')}
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="surname"
            render={({ field, fieldState }) => (
              <TextInput
                {...field}
                label={t('last_name_label')}
                error={fieldState.error?.message}
              />
            )}
          />
        </Group>

        <SegmentedControl
          value={contactType}
          onChange={handleContactTypeChange}
          data={[
            { label: t('email_tab'), value: 'email' },
            { label: t('phone_tab'), value: 'phone' },
          ]}
          fullWidth
        />

        {contactType === 'email' ? (
          <Controller
            control={control}
            name="email"
            render={({ field, fieldState }) => (
              <TextInput
                {...field}
                value={field.value ?? ''}
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
                value={field.value ?? undefined}
                label={t('phone_label')}
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

        <Controller
          control={control}
          name="checkPassword"
          render={({ field, fieldState }) => (
            <PasswordInput
              {...field}
              label={t('confirm_password_label')}
              error={fieldState.error?.message}
            />
          )}
        />

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
          {t('create_account_button')}
        </Button>

        <Text ta="center" size="sm" className="text-gray-500 dark:text-gray-400">
          {t('have_account')}{' '}
          <Anchor
            component="button"
            type="button"
            size="sm"
            c="primary.4"
            fw={500}
            onClick={onSwitch}
          >
            {t('sign_in_link')}
          </Anchor>
        </Text>
      </Stack>
    </form>
  );
};

export default RegisterForm;
