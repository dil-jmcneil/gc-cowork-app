import type { ChatStreamChunk, ToolIconKind } from "@/chat/chatTypes";
import { REGULATORY_CHANGES } from "@/regulatory/regulatoryChanges";

import { sleep, streamReasoning, streamText } from "./streamHelpers";

const CHANGE_WORD = /\b(changes?|updates?|new)\b/i;
const RULE_WORD = /\b(regulatory|regulations?|rules?)\b/i;
const RESEARCH_WORD = /\bresearch\b/i;

/** True when a prompt asks for the list of recent regulatory changes. */
export function isRegulatoryChangesPrompt(text: string): boolean {
  return CHANGE_WORD.test(text) && RULE_WORD.test(text) && !RESEARCH_WORD.test(text);
}

const TOOLS: { id: string; toolName: string; toolKind: ToolIconKind; detail: string }[] = [
  {
    id: "reg-search",
    toolName: "Searching SEC and Federal Register updates",
    toolKind: "web_search",
    detail: "Found 12 final and proposed rules from the last 90 days.",
  },
  {
    id: "reg-read",
    toolName: "Reading final rule text",
    toolKind: "web_fetch",
    detail: "Read 5 rules that apply to companies like yours.",
  },
  {
    id: "reg-policies",
    toolName: "Checking your policy library",
    toolKind: "arca",
    detail: "Matched the changes against 38 internal policies.",
  },
];

/** Scripted reply: reasoning, three tool calls, an intro line, then the list. */
export async function* streamRegulatoryChanges(
  signal: AbortSignal,
  charDelayMs = 6,
): AsyncGenerator<ChatStreamChunk> {
  const toolDelayMs = charDelayMs === 0 ? 0 : 600;

  yield* streamReasoning(
    "Checking recent rule changes against your policies",
    "Look for final and proposed rules from regulators that cover the company, then check which internal policies each one touches.",
    signal,
    charDelayMs,
  );

  for (const tool of TOOLS) {
    if (signal.aborted) return;
    yield { type: "tool-start", id: tool.id, toolName: tool.toolName, toolKind: tool.toolKind };
    await sleep(toolDelayMs, signal);
    if (signal.aborted) return;
    yield { type: "tool-update", id: tool.id, status: "success", detail: tool.detail };
  }

  yield* streamText(
    "Here are the recent regulatory changes that affect you, newest first.",
    signal,
    charDelayMs,
  );
  if (signal.aborted) return;
  yield { type: "regulatory-change-list", items: REGULATORY_CHANGES };
}
