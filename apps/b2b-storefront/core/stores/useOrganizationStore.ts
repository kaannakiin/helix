import type { OrgMemberRole } from '@org/prisma/browser';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';

interface ActiveOrganization {
  id: string;
  name: string;
  role: OrgMemberRole;
}

interface OrganizationState {
  activeOrganization: ActiveOrganization | null;
  setActiveOrganization: (org: ActiveOrganization | null) => void;
  clearOrganization: () => void;
}

export const useOrganizationStore = create<OrganizationState>()(
  persist(
    immer((set) => ({
      activeOrganization: null,

      setActiveOrganization: (org) =>
        set((state) => {
          state.activeOrganization = org;
        }),

      clearOrganization: () =>
        set((state) => {
          state.activeOrganization = null;
        }),
    })),
    {
      name: 'b2b-organization',
    }
  )
);
