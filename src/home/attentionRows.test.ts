import { EU_AI_ACT } from "@/signals/euAiAct";
import { ATG_RULING } from "@/signals/signals";
import { SEED_WORKSTREAMS } from "@/workstreams/workstreamStore";
import type { Workstream } from "@/workstreams/workstream";

import { ATTENTION_ITEMS } from "./attentionItems";
import { attentionRows } from "./attentionRows";

const NOW = new Date("2026-11-24T12:00:00Z");

test("a new signal with no workstream offers to create one", () => {
  const rows = attentionRows(ATTENTION_ITEMS, SEED_WORKSTREAMS, NOW);
  const atg = rows.find((r) => r.id === ATG_RULING.id)!;
  expect(atg.status).toEqual({ label: "New", color: "information" });
  expect(atg.action).toEqual({
    kind: "create",
    label: "Create workstream",
    href: `/workstreams/new?signal=${ATG_RULING.id}`,
  });
});

test("a signal with a workstream gives way to the tasks that need you", () => {
  const rows = attentionRows(ATTENTION_ITEMS, SEED_WORKSTREAMS, NOW);
  expect(rows.some((r) => r.id === EU_AI_ACT.id)).toBe(false);
  const review = rows.find((r) => r.id === "eu-ai-act-marking:provider")!;
  expect(review.title).toBe("Confirm who built the AI assistant");
  expect(review.area).toBe("EU AI marking readiness · Chris Okafor");
  expect(review.status).toEqual({ label: "Needs your review", color: "warning" });
  expect(review.action).toEqual({
    kind: "review",
    label: "Review",
    href: "/workstreams/eu-ai-act-marking?task=provider",
  });
});

test("an overdue task in any workstream asks you to nudge its owner", () => {
  const rows = attentionRows(ATTENTION_ITEMS, SEED_WORKSTREAMS, NOW);
  const vendor = rows.find((r) => r.id.endsWith(":climate-assurance"))!;
  expect(vendor.status).toEqual({ label: "Overdue", color: "error" });
  expect(vendor.action).toMatchObject({ kind: "nudge", label: "Nudge", taskId: "climate-assurance" });
});

test("tasks that don't need you get no row", () => {
  const rows = attentionRows(ATTENTION_ITEMS, SEED_WORKSTREAMS, NOW);
  expect(rows.some((r) => r.id.endsWith(":marking") || r.id.endsWith(":detect"))).toBe(false);
});

test("a signal's workstream with nothing waiting on you keeps one row to view it", () => {
  const eu = SEED_WORKSTREAMS.find((w) => w.sourceSignalId === EU_AI_ACT.id)!;
  const calm: Workstream = {
    ...eu,
    plan: { ...eu.plan, tasks: eu.plan.tasks.map((t) => ({ ...t, awaitingReview: false, deadline: "2026-12-20" })) },
  };
  const rows = attentionRows(ATTENTION_ITEMS, [calm], NOW);
  const view = rows.find((r) => r.id === EU_AI_ACT.id)!;
  expect(view.status).toEqual({ label: "On track", color: "information" });
  expect(view.action).toEqual({ kind: "view", label: "View workstream", href: "/workstreams/eu-ai-act-marking" });
});

test("rows put overdue work first, then reviews, then new signals", () => {
  const labels = attentionRows(ATTENTION_ITEMS, SEED_WORKSTREAMS, NOW).map((r) => r.status.label);
  expect(labels.indexOf("Overdue")).toBeLessThan(labels.indexOf("Needs your review"));
  expect(labels.indexOf("Needs your review")).toBeLessThan(labels.indexOf("New"));
});
