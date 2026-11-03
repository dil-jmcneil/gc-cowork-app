import type { ChatStreamChunk, ToolIconKind } from "@/chat/chatTypes";
import { INSIGHTS } from "@/insights/insights";

import { sleep, streamReasoning, streamText } from "./streamHelpers";

const INSIGHT_WORD = /\binsights?\b/i;
const CHANGE_WORD = /\b(changes?|updates?|new|recent)\b/i;
const SOURCE_WORD = /\b(regulatory|regulations?|rules?|rulings?|court|cases?)\b/i;
const RESEARCH_WORD = /\bresearch\b/i;

/** True when a prompt asks for the list of recent insights. */
export function isInsightsPrompt(text: string): boolean {
  if (RESEARCH_WORD.test(text)) return false;
  return INSIGHT_WORD.test(text) || (CHANGE_WORD.test(text) && SOURCE_WORD.test(text));
}

const TOOLS: {
  id: string;
  toolName: string;
  toolKind: ToolIconKind;
  detail: string;
}[] = [
  {
    id: "insight-search",
    toolName: "Reading new Delaware court opinions and SEC rules",
    toolKind: "web_search",
    detail: "Read 40 new opinions. 2 are about bylaws, and 1 applies to Acme.",
  },
  {
    id: "insight-read",
    toolName: "Reading your bylaws and 2026 proxy on EDGAR",
    toolKind: "web_fetch",
    detail: "Article II, Section 8 hasn't changed since 2008. The nomination window opens Jan 8.",
  },
  {
    id: "insight-policies",
    toolName: "Checking your policy library",
    toolKind: "arca",
    detail: "Compared each holding with Section 8 and the nominee questionnaire.",
  },
];

/** Scripted reply: reasoning, three tool calls, an intro line, then the list. */
export async function* streamInsights(signal: AbortSignal, charDelayMs = 6): AsyncGenerator<ChatStreamChunk> {
  const toolDelayMs = charDelayMs === 0 ? 0 : 600;

  yield* streamReasoning(
    "Checking new rulings and rules against your documents",
    "Look for new court rulings and rules that cover the company, then compare each one with the bylaws and policies it touches.",
    signal,
    charDelayMs,
  );

  for (const tool of TOOLS) {
    if (signal.aborted) return;
    yield {
      type: "tool-start",
      id: tool.id,
      toolName: tool.toolName,
      toolKind: tool.toolKind,
    };
    await sleep(toolDelayMs, signal);
    if (signal.aborted) return;
    yield {
      type: "tool-update",
      id: tool.id,
      status: "success",
      detail: tool.detail,
    };
  }

  yield* streamText(
    "Here are your recent insights, newest first. The Delaware ruling needs action before your nomination window opens.",
    signal,
    charDelayMs,
  );
  if (signal.aborted) return;
  yield { type: "insight-list", items: INSIGHTS };
}
