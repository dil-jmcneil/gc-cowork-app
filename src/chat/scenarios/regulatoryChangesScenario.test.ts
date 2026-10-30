import type { ChatStreamChunk } from "@/chat/chatTypes";
import {
  isRegulatoryChangesPrompt,
  streamRegulatoryChanges,
} from "@/chat/scenarios/regulatoryChangesScenario";
import {
  DUE_SOON_PROMPT,
  RESEARCH_REGULATION_PROMPT,
  SHOW_REGULATORY_CHANGES_PROMPT,
} from "@/home/quickActionPrompts";
import { CYBER_RULE_CHANGE, REGULATORY_CHANGES } from "@/regulatory/regulatoryChanges";

test("matches quick action and free-text asks", () => {
  for (const text of [
    SHOW_REGULATORY_CHANGES_PROMPT,
    "what are the latest regulatory changes?",
    "any new rule changes this month",
    "recent regulatory updates",
  ]) {
    expect(isRegulatoryChangesPrompt(text), text).toBe(true);
  }
});

test("does not match other quick actions", () => {
  for (const text of [
    RESEARCH_REGULATION_PROMPT,
    DUE_SOON_PROMPT,
    "help me research a regulation",
    "review a contract",
  ]) {
    expect(isRegulatoryChangesPrompt(text), text).toBe(false);
  }
});

test("first change is the SEC cyber rule", () => {
  expect(REGULATORY_CHANGES).toHaveLength(5);
  const [first] = REGULATORY_CHANGES;
  expect(first).toBe(CYBER_RULE_CHANGE);
  expect(first.title).toBe("New cyber-attack reporting rule");
  expect(first.regulatoryBody).toBe("SEC");
  expect(first.status).toBe("New");
  expect(first.summary).toBe(
    "The SEC tightened its cyber rule. A company must now report a material cyber-attack on Form 8-K, under Item 1.05, within four business days after it decides that the attack is material.",
  );
  for (const change of REGULATORY_CHANGES) {
    expect(change.deadlines.length).toBeGreaterThan(0);
    expect(change.reasonsRelevant.length).toBeGreaterThan(0);
  }
});

test("streams reasoning, then resolving tools, then intro, then the list", async () => {
  const collected: ChatStreamChunk[] = [];
  for await (const chunk of streamRegulatoryChanges(new AbortController().signal, 0)) {
    collected.push(chunk);
  }
  const firstSeen = [...new Set(collected.map((c) => c.type))];
  expect(firstSeen).toEqual([
    "reasoning-summary",
    "reasoning-delta",
    "tool-start",
    "tool-update",
    "text-delta",
    "regulatory-change-list",
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
  expect(last.type).toBe("regulatory-change-list");
  expect(last.type === "regulatory-change-list" && last.items).toBe(REGULATORY_CHANGES);
});
