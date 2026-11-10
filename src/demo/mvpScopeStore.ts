import { create } from "zustand";

/**
 * Demo switches for scope, persisted in localStorage.
 *
 * - Post-MVP views (docs/superpowers/plans/2026-11-04-workstream-mvp-simplification.md):
 *   every link goes to the workstream page. The task page, the task quick-view
 *   dialog, the older create page and "Revise via chat" stay in the code for
 *   later, hidden unless this switch shows them. (The signal dialog is back:
 *   attention cards open it.)
 * - Q4 MVP configuration: hides what isn't in the Q4 release. The compliance
 *   calendar shows only its Timeline view (no Swimlane or Calendar, and no view
 *   toggle), and the left nav has no Workstreams item; you reach a workstream
 *   from its attention card or its tasks on the calendar.
 */
const POST_MVP_KEY = "gc-cowork-show-post-mvp-views";
const Q4_MVP_KEY = "gc-cowork-q4-mvp";

function readPersisted(key: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}

function writePersisted(key: string, value: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    /* ignore quota or privacy errors */
  }
}

type MvpScopeState = {
  showPostMvpViews: boolean;
  setShowPostMvpViews: (show: boolean) => void;
  q4Mvp: boolean;
  setQ4Mvp: (on: boolean) => void;
};

export const useMvpScopeStore = create<MvpScopeState>((set) => ({
  showPostMvpViews: readPersisted(POST_MVP_KEY),
  setShowPostMvpViews: (showPostMvpViews) => {
    writePersisted(POST_MVP_KEY, showPostMvpViews);
    set({ showPostMvpViews });
  },
  q4Mvp: readPersisted(Q4_MVP_KEY),
  setQ4Mvp: (q4Mvp) => {
    writePersisted(Q4_MVP_KEY, q4Mvp);
    set({ q4Mvp });
  },
}));
