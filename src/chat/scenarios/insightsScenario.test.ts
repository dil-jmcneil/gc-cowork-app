import type { ChatStreamChunk } from "@/chat/chatTypes";
import { isInsightsPrompt, streamInsights } from "@/chat/scenarios/insightsScenario";
import { DUE_SOON_PROMPT, RESEARCH_REGULATION_PROMPT, SHOW_INSIGHTS_PROMPT } from "@/home/quickActionPrompts";
import { insightType } from "@/insights/insight";
import { ATG_RULING, INSIGHTS } from "@/insights/insights";

test("matches quick action and free-text asks", () => {
  for (const text of [
    SHOW_INSIGHTS_PROMPT,
    "show recent insights",
    "any new court rulings?",
    "what are the latest regulatory changes?",
    "any new rule changes this month",
    "recent regulatory updates",
  ]) {
    expect(isInsightsPrompt(text), text).toBe(true);
  }
});

test("does not match other quick actions", () => {
  for (const text of [
    RESEARCH_REGULATION_PROMPT,
    DUE_SOON_PROMPT,
    "help me research a regulation",
    "review a contract",
  ]) {
    expect(isInsightsPrompt(text), text).toBe(false);
  }
});

test("the court ruling is the one insight, tagged as a Delaware court ruling", () => {
  expect(INSIGHTS).toEqual([ATG_RULING]);
  expect(insightType(ATG_RULING)).toBe("Court ruling");
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
  for await (const chunk of streamInsights(new AbortController().signal, 0)) {
    collected.push(chunk);
  }
  const firstSeen = [...new Set(collected.map((c) => c.type))];
  expect(firstSeen).toEqual([
    "reasoning-summary",
    "reasoning-delta",
    "tool-start",
    "tool-update",
    "text-delta",
    "insight-list",
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
  expect(last.type).toBe("insight-list");
  expect(last.type === "insight-list" && last.items).toBe(INSIGHTS);
});
