/** How much of a timeline shows: the last two days, then 10 more, then everything. */
export type TimelineStep = "recent" | "ten" | "all";

const RECENT_MS = 2 * 24 * 60 * 60 * 1000;
const STEP_SIZE = 10;

export type TimelineView<T> = {
  shown: T[];
  /** The next step up, with its button label; undefined when everything shows. */
  next?: { step: TimelineStep; label: string };
};

/** Which entries of a newest-first list show at `step`. */
export function timelineWindow<T extends { sentAt: string }>(
  items: T[],
  now: Date,
  step: TimelineStep,
): TimelineView<T> {
  const recent = items.filter((i) => now.getTime() - new Date(i.sentAt).getTime() <= RECENT_MS).length;
  const ten = recent + STEP_SIZE;
  const all = { step: "all" as const, label: `Show all (${items.length})` };

  if (step === "all" || items.length === 0) return { shown: items };
  if (step === "ten") return { shown: items.slice(0, ten), next: items.length > ten ? all : undefined };
  if (items.length <= recent) return { shown: items };
  if (items.length <= ten) return { shown: items.slice(0, recent), next: all };
  return {
    shown: items.slice(0, recent),
    next: { step: "ten", label: recent ? `Show ${STEP_SIZE} more` : `Show the latest ${STEP_SIZE}` },
  };
}
