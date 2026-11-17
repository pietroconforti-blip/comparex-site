import { useEffect } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getOffer, type CategoryId, type CityId } from "@/data/catalog";
import { clampBudget } from "@/lib/money";
import type { Pick } from "@/lib/package-math";

type State = {
  city: CityId;
  budget: number;
  picks: Partial<Record<CategoryId, Pick>>;
  recent: string[];
  compare: string[];
  handoffs: string[];
  setCity: (city: CityId) => void;
  setBudget: (budget: number) => void;
  pick: (category: CategoryId, pick: Pick | null) => void;
  setUserMonthly: (category: CategoryId, userMonthly: number | null) => void;
  toggleCompare: (id: string) => void;
  clearCompare: () => void;
  noteRecent: (id: string) => void;
  markHandoff: (id: string) => void;
  replaceAll: (next: { city: CityId; budget: number; picks: Partial<Record<CategoryId, Pick>> }) => void;
  clearPackage: () => void;
};

export const usePackageStore = create<State>()(
  persist(
    (set) => ({
      city: "vienna",
      budget: 600,
      picks: {},
      recent: [],
      compare: [],
      handoffs: [],
      setCity: (city) =>
        set((state) => ({
          city,
          picks: Object.fromEntries(
            Object.entries(state.picks).filter((entry) => {
              const pick = entry[1] as Pick | undefined;
              return pick ? getOffer(pick.offerId)?.city === city : false;
            }),
          ) as State["picks"],
        })),
      setBudget: (budget) => set({ budget: clampBudget(budget) }),
      pick: (category, pick) =>
        set((state) => {
          const picks = { ...state.picks };
          if (!pick) delete picks[category];
          else picks[category] = pick;
          return { picks };
        }),
      setUserMonthly: (category, userMonthly) =>
        set((state) => {
          const current = state.picks[category];
          if (!current) return {};
          return { picks: { ...state.picks, [category]: { ...current, userMonthly } } };
        }),
      toggleCompare: (id) =>
        set((state) => ({
          compare: state.compare.includes(id)
            ? state.compare.filter((item) => item !== id)
            : [...state.compare, id].slice(-3),
        })),
      clearCompare: () => set({ compare: [] }),
      noteRecent: (id) =>
        set((state) => ({
          recent: [id, ...state.recent.filter((item) => item !== id)].slice(0, 12),
        })),
      markHandoff: (id) =>
        set((state) => ({
          handoffs: state.handoffs.includes(id) ? state.handoffs : [...state.handoffs, id],
        })),
      replaceAll: (next) =>
        set({
          city: next.city,
          budget: clampBudget(next.budget),
          picks: next.picks,
        }),
      clearPackage: () => set({ picks: {} }),
    }),
    { name: "comparex.v1", skipHydration: true },
  ),
);

export function useHydratePackage() {
  useEffect(() => {
    void usePackageStore.persist.rehydrate();
  }, []);
}
