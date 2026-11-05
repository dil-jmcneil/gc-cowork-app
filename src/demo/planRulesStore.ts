import { create } from "zustand";

/**
 * Whether plans show the rules Cowork follows: the "Rules Cowork Follows"
 * card on a workstream, and the rule cited on Cowork's actions. Hidden by
 * default; a Demo settings toggle exposes them. Persisted in localStorage.
 */
const STORAGE_KEY = "gc-cowork-show-plan-rules";

function readPersisted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function writePersisted(show: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, String(show));
  } catch {
    /* ignore quota or privacy errors */
  }
}

type PlanRulesState = {
  showRules: boolean;
  setShowRules: (show: boolean) => void;
};

export const usePlanRulesStore = create<PlanRulesState>((set) => ({
  showRules: readPersisted(),
  setShowRules: (showRules) => {
    writePersisted(showRules);
    set({ showRules });
  },
}));
