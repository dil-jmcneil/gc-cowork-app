import { create } from "zustand";

/**
 * Which visual/behavioral theme the prototype renders.
 *
 * - `current` — today's shipped Atlas surface, unchanged.
 * - `refreshed` — the lighter, calmer redesign from the Atlas AI Components
 *   visual design review (lighter muted text, flatter primary action color,
 *   summarized reasoning, and simplified tool-call/user-bubble presentation).
 *
 * Exposed through the Demo settings FAB and persisted in localStorage so the
 * choice survives reloads.
 */
export type ThemeVariant = "current" | "refreshed";

const STORAGE_KEY = "gc-cowork-theme-variant";
const DEFAULT_VARIANT: ThemeVariant = "current";

function isThemeVariant(value: unknown): value is ThemeVariant {
  return value === "current" || value === "refreshed";
}

function readPersisted(): ThemeVariant {
  if (typeof window === "undefined") return DEFAULT_VARIANT;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return isThemeVariant(raw) ? raw : DEFAULT_VARIANT;
  } catch {
    return DEFAULT_VARIANT;
  }
}

function writePersisted(variant: ThemeVariant): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, variant);
  } catch {
    /* ignore quota or privacy errors */
  }
}

type ThemeVariantState = {
  variant: ThemeVariant;
  setVariant: (variant: ThemeVariant) => void;
};

export const useThemeVariantStore = create<ThemeVariantState>((set) => ({
  variant: readPersisted(),
  setVariant: (variant) => {
    writePersisted(variant);
    set({ variant });
  },
}));

