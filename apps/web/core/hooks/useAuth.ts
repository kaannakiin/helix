import { DATA_ACCESS_KEYS } from '@org/constants/data-keys';
import {
  LoginSchemaOutputType,
  RegisterSchemaOutputType,
} from '@org/schemas/auth';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../lib/api/api-client';

export const useLogin = () => {
  return useMutation({
    mutationKey: DATA_ACCESS_KEYS.auth.login,
    mutationFn: async (loginDt: LoginSchemaOutputType) => {
      const res = await apiClient.post('/auth/login', loginDt);
      return res.data;
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationKey: DATA_ACCESS_KEYS.auth.register,
    mutationFn: async (registerDt: RegisterSchemaOutputType) => {
      const res = await apiClient.post('/auth/register', registerDt);
      return res.data;
    },
  });
};

export const useLogout = () => {
  return useMutation({
    mutationKey: DATA_ACCESS_KEYS.auth.logout,
    mutationFn: async () => {
      const res = await apiClient.post('/auth/logout');
      return res.data;
    },
    onSuccess: async () => {
      if (typeof window !== 'undefined') {
        const { useAuthStore } = await import('@/core/stores/auth.store');
        useAuthStore.getState().clearUser();
        const { useRouter } = await import('next/navigation');
        const router = useRouter();
        router.push('/');
      }
    },
  });
};
