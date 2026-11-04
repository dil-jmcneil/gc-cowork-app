import type { HistoryEntry } from "@/workstreams/thread";

import { timelineWindow } from "./timelineWindow";

const NOW = new Date("2026-11-04T12:00:00Z");

function entry(id: string, sentAt: string): HistoryEntry {
  return { kind: "action", id, actor: "Cowork", summary: id, sentAt };
}

/** Newest first: 3 entries in the last two days, then 12 older ones. */
const items = [
  entry("a", "2026-11-04T09:00:00Z"),
  entry("b", "2026-11-03T09:00:00Z"),
  entry("c", "2026-11-02T13:00:00Z"),
  ...Array.from({ length: 12 }, (_, i) => entry(`old-${i}`, `2026-10-${String(30 - i).padStart(2, "0")}T09:00:00Z`)),
];

test("by default, only the last two days show, with a step up to 10", () => {
  const view = timelineWindow(items, NOW, "recent");
  expect(view.shown.map((e) => e.id)).toEqual(["a", "b", "c"]);
  expect(view.next).toEqual({ step: "ten", label: "Show 10 more" });
});

test("then 10 more, then everything", () => {
  const ten = timelineWindow(items, NOW, "ten");
  expect(ten.shown).toHaveLength(13);
  expect(ten.next).toEqual({ step: "all", label: "Show all (15)" });
  const all = timelineWindow(items, NOW, "all");
  expect(all.shown).toHaveLength(15);
  expect(all.next).toBeUndefined();
});

test("with nothing in the last two days, the list says so and offers the latest 10", () => {
  const view = timelineWindow(items.slice(3), NOW, "recent");
  expect(view.shown).toHaveLength(0);
  expect(view.next).toEqual({ step: "ten", label: "Show the latest 10" });
});

test("a short list skips straight to all", () => {
  const view = timelineWindow(items.slice(0, 5), NOW, "recent");
  expect(view.next).toEqual({ step: "all", label: "Show all (5)" });
});
