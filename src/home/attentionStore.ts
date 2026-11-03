import { create } from "zustand";

import type { AttentionItem } from "./attentionItems";

/**
 * What the GC has done with items in the attention pane. Snoozed items leave
 * the list until their date; dismissed items leave it for good. In memory
 * only, like workstreams, so a reload resets the demo.
 */
type AttentionState = {
  /** Item id → ISO date-time when it comes back. */
  snoozedUntil: Record<string, string>;
  /** Items that came back from a snooze, shown with a "Back from snooze" chip until opened. */
  backFromSnooze: Record<string, true>;
  dismissed: Record<string, true>;
  snooze: (id: string, now?: Date) => void;
  unsnooze: (id: string) => void;
  dismiss: (id: string) => void;
  restore: (id: string) => void;
  /** Opening an item clears its "Back from snooze" chip. */
  markSeen: (id: string) => void;
};

/** Snoozes resurface at 8 am on the next Monday, never today. */
export function nextMonday(now: Date): Date {
  const next = new Date(now);
  const daysAhead = (8 - now.getDay()) % 7 || 7;
  next.setDate(now.getDate() + daysAhead);
  next.setHours(8, 0, 0, 0);
  return next;
}

const omit = <T>(record: Record<string, T>, id: string): Record<string, T> => {
  const { [id]: _removed, ...rest } = record;
  return rest;
};

export const useAttentionStore = create<AttentionState>((set) => ({
  snoozedUntil: {},
  backFromSnooze: {},
  dismissed: {},
  snooze: (id, now = new Date()) =>
    set((s) => ({
      snoozedUntil: { ...s.snoozedUntil, [id]: nextMonday(now).toISOString() },
      backFromSnooze: omit(s.backFromSnooze, id),
    })),
  unsnooze: (id) =>
    set((s) => ({ snoozedUntil: omit(s.snoozedUntil, id), backFromSnooze: { ...s.backFromSnooze, [id]: true } })),
  dismiss: (id) => set((s) => ({ dismissed: { ...s.dismissed, [id]: true }, snoozedUntil: omit(s.snoozedUntil, id) })),
  restore: (id) => set((s) => ({ dismissed: omit(s.dismissed, id) })),
  markSeen: (id) => set((s) => ({ backFromSnooze: omit(s.backFromSnooze, id) })),
}));

export type AttentionView = {
  active: { item: AttentionItem; backFromSnooze: boolean }[];
  snoozed: { item: AttentionItem; until: string }[];
};

/** Splits items into what shows now and what's snoozed. A snooze that has passed counts as back from snooze. */
export function attentionView(
  items: AttentionItem[],
  state: Pick<AttentionState, "snoozedUntil" | "backFromSnooze" | "dismissed">,
  now: Date,
): AttentionView {
  const view: AttentionView = { active: [], snoozed: [] };
  for (const item of items) {
    if (state.dismissed[item.id]) continue;
    const until = state.snoozedUntil[item.id];
    if (until && new Date(until) > now) {
      view.snoozed.push({ item, until });
      continue;
    }
    view.active.push({ item, backFromSnooze: Boolean(until) || Boolean(state.backFromSnooze[item.id]) });
  }
  return view;
}
