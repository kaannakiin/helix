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

interface BindingRef {
  id: string;
  hostname: string;
  status: string;
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
