import { create } from "zustand";

/**
 * MVP scope (docs/superpowers/plans/2026-11-04-workstream-mvp-simplification.md):
 * every link goes to the workstream page. The task page, the task quick-view
 * dialog, the older create page and "Revise via chat" stay in the code for
 * later, hidden unless this Demo settings switch shows them. (The signal
 * dialog is back: attention cards open it.) Persisted in
 * localStorage.
 */
const STORAGE_KEY = "gc-cowork-show-post-mvp-views";

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

type MvpScopeState = {
  showPostMvpViews: boolean;
  setShowPostMvpViews: (show: boolean) => void;
};

export const useMvpScopeStore = create<MvpScopeState>((set) => ({
  showPostMvpViews: readPersisted(),
  setShowPostMvpViews: (showPostMvpViews) => {
    writePersisted(showPostMvpViews);
    set({ showPostMvpViews });
  },
}));
