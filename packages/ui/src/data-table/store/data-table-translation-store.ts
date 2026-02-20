import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { ContextMenuTranslations } from "../types/contextMenu.types";
import type { DataTableFooterTranslations } from "../types/footer.types";

export interface DataTableFilterTranslations {
  reset: string;
  text: {
    placeholder: string;
  };
  date: {
    placeholder: string;
    placeholderTo: string;
    equals: string;
    greaterThan: string;
    lessThan: string;
    inRange: string;
  };
  boolean: {
    placeholder: string;
    yes: string;
    no: string;
  };
  number: {
    placeholder: string;
    placeholderTo: string;
    equals: string;
    greaterThan: string;
    lessThan: string;
    inRange: string;
  };
  locale: {
    placeholder: string;
    labels: {
      en: string;
      tr: string;
      de: string;
      fr: string;
      es: string;
      it: string;
      nl: string;
    };
  };
}

export interface DataTableFilterDrawerTranslations {
  title: string;
  clearAll: string;
  activeFilters: string;
  noFilters: string;
  apply: string;
}

export interface DataTableTranslations {
  filters: DataTableFilterTranslations;
  columns?: Record<string, string>;
  agGrid?: Record<string, string>;
  contextMenu?: ContextMenuTranslations;
  footer?: DataTableFooterTranslations;
  filterDrawer?: DataTableFilterDrawerTranslations;
}

export const DEFAULT_TRANSLATIONS: DataTableTranslations = {
  filters: {
    reset: "Reset",
    text: {
      placeholder: "Filter...",
    },
    date: {
      placeholder: "Select date...",
      placeholderTo: "Select end date...",
      equals: "Equals",
      greaterThan: "After",
      lessThan: "Before",
      inRange: "Between",
    },
    boolean: {
      placeholder: "Select...",
      yes: "Yes",
      no: "No",
    },
    number: {
      placeholder: "Value...",
      placeholderTo: "To...",
      equals: "Equals",
      greaterThan: "Greater than",
      lessThan: "Less than",
      inRange: "Between",
    },
    locale: {
      placeholder: "Select locale...",
      labels: {
        en: "English",
        tr: "Turkish",
        de: "German",
        fr: "French",
        es: "Spanish",
        it: "Italian",
        nl: "Dutch",
      },
    },
  },
};

interface DataTableTranslationState {
  translations: DataTableTranslations;
  setTranslations: (translations: DataTableTranslations) => void;
  mergeTranslations: (partial: Partial<DataTableTranslations>) => void;
}

export const useDataTableTranslationStore =
  create<DataTableTranslationState>()(
    immer((set) => ({
      translations: DEFAULT_TRANSLATIONS,

      setTranslations: (translations) =>
        set((state) => {
          state.translations = translations;
        }),

      mergeTranslations: (partial) =>
        set((state) => {
          Object.assign(state.translations, partial);
        }),
    })),
  );

export function useDataTableTranslations(): DataTableTranslations {
  return useDataTableTranslationStore((s) => s.translations);
}
