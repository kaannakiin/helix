'use client';

import type { CustomerTokenPayload } from '@org/types/storefront';
import { useRef } from 'react';
import { useCustomerAuthStore } from '../stores/useCustomerAuthStore';

export function CustomerAuthProvider({
  customer,
  children,
}: {
  customer: CustomerTokenPayload | null;
  children: React.ReactNode;
}) {
  const initialized = useRef(false);

  if (!initialized.current) {
    useCustomerAuthStore.getState().initializeCustomer(customer);
    initialized.current = true;
  }

  return children;
}
