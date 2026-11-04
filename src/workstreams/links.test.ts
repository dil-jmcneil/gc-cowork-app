import { deriveCalendarEvents } from "@/calendar/complianceEvents";
import { ATG_RULING } from "@/signals/signals";

import { draftWorkstreamHref, workstreamFocusFromSearch, workstreamHref } from "./links";
import { draftWorkstreamFromSignal } from "./workstreamDraft";
import type { Workstream } from "./workstream";

test("a workstream link can open on a milestone and a task", () => {
  expect(workstreamHref("ws-1")).toBe("/workstreams/ws-1");
  expect(workstreamHref("ws-1", { milestoneId: "assess", taskId: "atg-v-lane-memo" })).toBe(
    "/workstreams/ws-1?milestone=assess&task=atg-v-lane-memo",
  );
});

test("the focus reads back from the query string", () => {
  expect(workstreamFocusFromSearch("?milestone=assess&task=atg-v-lane-memo")).toEqual({
    milestoneId: "assess",
    taskId: "atg-v-lane-memo",
  });
  expect(workstreamFocusFromSearch("")).toEqual({});
});

test("a signal with no workstream links to its draft", () => {
  expect(draftWorkstreamHref("atg-v-lane")).toBe("/workstreams/new?signal=atg-v-lane");
});

test("calendar tasks link to their workstream, opened on the task's milestone", () => {
  const workstream: Workstream = {
    ...draftWorkstreamFromSignal(ATG_RULING),
    id: "ws-1",
    statusSummary: "",
    createdAt: "2026-10-27T00:00:00Z",
  };
  const events = deriveCalendarEvents([workstream], new Date("2026-11-03T12:00:00Z"));
  const memo = events.find((e) => e.kind === "task" && e.taskId.endsWith("memo"));
  expect(memo?.href).toBe(`/workstreams/ws-1?milestone=assess&task=${memo?.kind === "task" ? memo.taskId : ""}`);
  const windowOpens = events.find((e) => e.kind === "external" && e.signalId === ATG_RULING.id);
  expect(windowOpens?.href).toBe("/workstreams/ws-1");
});

test("a deadline with no workstream links to the signal's draft", () => {
  const windowOpens = deriveCalendarEvents([], new Date("2026-11-03T12:00:00Z")).find(
    (e) => e.kind === "external" && e.signalId === ATG_RULING.id,
  );
  expect(windowOpens?.href).toBe("/workstreams/new?signal=atg-v-lane");
});
