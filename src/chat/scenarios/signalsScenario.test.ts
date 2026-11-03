import type { ChatStreamChunk } from "@/chat/chatTypes";
import { isSignalsPrompt, streamSignals } from "@/chat/scenarios/signalsScenario";
import { DUE_SOON_PROMPT, RESEARCH_REGULATION_PROMPT, SHOW_SIGNALS_PROMPT } from "@/home/quickActionPrompts";
import { signalType } from "@/signals/signal";
import { ATTENTION_ITEMS } from "@/home/attentionItems";
import { ATG_RULING, SIGNALS, PAST_SIGNALS } from "@/signals/signals";

test("matches quick action and free-text asks", () => {
  for (const text of [
    SHOW_SIGNALS_PROMPT,
    "show recent signals",
    "any new court rulings?",
    "what are the latest regulatory changes?",
    "any new rule changes this month",
    "recent regulatory updates",
  ]) {
    expect(isSignalsPrompt(text), text).toBe(true);
  }
});

test("does not match other quick actions", () => {
  for (const text of [
    RESEARCH_REGULATION_PROMPT,
    DUE_SOON_PROMPT,
    "help me research a regulation",
    "review a contract",
  ]) {
    expect(isSignalsPrompt(text), text).toBe(false);
  }
});

test("the court ruling leads the signals, tagged as a Delaware court ruling", () => {
  expect(SIGNALS[0]).toBe(ATG_RULING);
  expect(signalType(ATG_RULING)).toBe("Court ruling");
  expect(ATG_RULING.tags).toContainEqual({ kind: "jurisdiction", label: "Delaware" });
  expect(ATG_RULING.tags.filter((t) => t.kind === "type")).toHaveLength(1);
});

test("the ruling's deadlines are the nomination window, in date order", () => {
  expect(ATG_RULING.deadlines.map((d) => d.date)).toEqual(["2027-01-08", "2027-02-06"]);
  for (const deadline of ATG_RULING.deadlines) expect(deadline.description?.length).toBeGreaterThan(0);
  expect(ATG_RULING.reasonsRelevant.length).toBeGreaterThanOrEqual(3);
});

test("streams reasoning, then resolving tools, then intro, then the list", async () => {
  const collected: ChatStreamChunk[] = [];
  for await (const chunk of streamSignals(new AbortController().signal, 0)) {
    collected.push(chunk);
  }
  const firstSeen = [...new Set(collected.map((c) => c.type))];
  expect(firstSeen).toEqual([
    "reasoning-summary",
    "reasoning-delta",
    "tool-start",
    "tool-update",
    "text-delta",
    "signal-list",
  ]);
  const starts = collected.filter((c) => c.type === "tool-start");
  expect(starts).toHaveLength(3);
  for (const start of starts) {
    const startIndex = collected.indexOf(start);
    const update = collected.findIndex(
      (c, i) => i > startIndex && c.type === "tool-update" && start.type === "tool-start" && c.id === start.id,
    );
    expect(update).toBeGreaterThan(startIndex);
    const chunk = collected[update];
    expect(chunk.type === "tool-update" && chunk.status).toBe("success");
  }
  const last = collected[collected.length - 1];
  expect(last.type).toBe("signal-list");
  expect(last.type === "signal-list" && last.items).toBe(SIGNALS);
});

test("there are five past signals of mixed types, two with past workstreams, all older than the ruling", () => {
  expect(PAST_SIGNALS).toHaveLength(5);
  expect(new Set(PAST_SIGNALS.map(signalType)).size).toBeGreaterThanOrEqual(3);
  expect(PAST_SIGNALS.filter((i) => i.pastWorkstream)).toHaveLength(2);
  for (const signal of PAST_SIGNALS) {
    expect(signal.issuedDate < "2026-11-03", signal.id).toBe(true);
    expect(signal.status, signal.id).not.toBe("New");
  }
});

test("past signals stay out of the attention pane, which is for new items", () => {
  const ids = new Set(ATTENTION_ITEMS.map((i) => i.id));
  for (const signal of PAST_SIGNALS) expect(ids.has(signal.id), signal.id).toBe(false);
});

test("the chat list carries every signal", async () => {
  const chunks: ChatStreamChunk[] = [];
  for await (const chunk of streamSignals(new AbortController().signal, 0)) chunks.push(chunk);
  const list = chunks.find((c) => c.type === "signal-list");
  expect(list?.type === "signal-list" && list.items.map((i) => i.id)).toEqual(SIGNALS.map((i) => i.id));
});
