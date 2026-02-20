'use client';

import { useAuthStore } from '@/core/stores/auth.store';
import type { TokenPayload } from '@org/types/token';
import { useRef } from 'react';

export function AuthProvider({
  user,
  children,
}: {
  user: TokenPayload | null;
  children: React.ReactNode;
}) {
  const initialized = useRef(false);

  if (!initialized.current) {
    useAuthStore.getState().initializeUser(user);
    initialized.current = true;
  }

  return children;
}
