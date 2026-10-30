import type { ChatStreamChunk } from "@/chat/chatTypes";
import { streamMockReply } from "@/chat/mockChatAdapter";
import { RESEARCH_REGULATION_PROMPT, SHOW_REGULATORY_CHANGES_PROMPT } from "@/home/quickActionPrompts";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

async function collect(prompt: string): Promise<ChatStreamChunk[]> {
  const out: ChatStreamChunk[] = [];
  const run = (async () => {
    for await (const c of streamMockReply(prompt, new AbortController().signal)) out.push(c);
  })();
  await vi.runAllTimersAsync();
  await run;
  return out;
}

test("regulatory prompt streams the list then finishes", async () => {
  const chunks = await collect(SHOW_REGULATORY_CHANGES_PROMPT);
  expect(chunks.some((c) => c.type === "regulatory-change-list")).toBe(true);
  expect(chunks[chunks.length - 1].type).toBe("finish");
});

test("research prompt gets the generic text reply", async () => {
  const chunks = await collect(RESEARCH_REGULATION_PROMPT);
  expect(chunks.some((c) => c.type === "regulatory-change-list")).toBe(false);
  expect(chunks.some((c) => c.type === "text-delta")).toBe(true);
});
