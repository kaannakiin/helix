import type { DomainSpaceView } from '@org/schemas/admin/settings';
import { create } from 'zustand';

interface DomainSpaceRef {
  id: string;
  baseDomain: string;
  status: string;
  ownership: { status: string };
  routing: {
    apex: { status: string };
    wildcard: { status: string };
  };
}

interface DnsRecord {
  type: string;
  name: string;
  value: string;
}

interface BindingRef {
  id: string;
  hostname: string;
  status: string;
  dns?: DnsRecord[];
}

interface DomainWizardState {
  hostname: string;
  baseDomain: string;
  isApex: boolean;
  isMultiStore: boolean;
  bindingType: 'PRIMARY' | 'ALIAS';
  domainSpace: DomainSpaceRef | null;
  binding: BindingRef | null;

  setHostname: (hostname: string, baseDomain: string, isApex: boolean) => void;
  setMultiStore: (value: boolean) => void;
  setBindingType: (type: 'PRIMARY' | 'ALIAS') => void;
  setDomainSpace: (space: DomainSpaceRef | null) => void;
  setBinding: (binding: BindingRef | null) => void;
  reset: () => void;
}

const initialState = {
  hostname: '',
  baseDomain: '',
  isApex: false,
  isMultiStore: false,
  bindingType: 'PRIMARY' as const,
  domainSpace: null,
  binding: null,
};

export const useWizardState = create<DomainWizardState>((set) => ({
  ...initialState,
  setHostname: (hostname, baseDomain, isApex) =>
    set({ hostname, baseDomain, isApex }),
  setMultiStore: (isMultiStore) => set({ isMultiStore }),
  setBindingType: (bindingType) => set({ bindingType }),
  setDomainSpace: (domainSpace) => set({ domainSpace }),
  setBinding: (binding) => set({ binding }),
  reset: () => set(initialState),
}));

/**
 * Derives the correct wizard step from server state.
 * Step 0: Enter Domain (no DomainSpace)
 * Step 1: Verify Ownership (ownership not yet VERIFIED)
 * Step 2: Setup Routing (ownership VERIFIED, routing/binding not complete)
 * Step 3: Complete (ACTIVE binding exists for this hostname)
 */
export function deriveWizardStep(
  domainSpace: DomainSpaceView | null,
  hostname: string,
): number {
  if (!domainSpace) return 0;

  if (domainSpace.ownership.status !== 'VERIFIED') return 1;

  const hasActiveBinding = domainSpace.hostBindings.some(
    (b) => b.hostname === hostname && b.status === 'ACTIVE',
  );
  if (hasActiveBinding) return 3;

  return 2;
}
