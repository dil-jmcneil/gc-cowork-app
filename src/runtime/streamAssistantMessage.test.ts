import { useChatMessagesStore } from "@/chat/chatMessagesStore";
import type { ChatStreamChunk } from "@/chat/chatTypes";
import type { Insight } from "@/insights/insight";
import { streamAssistantMessage } from "@/runtime/streamAssistantMessage";

const item: Insight = {
  id: "x",
  title: "T",
  summary: "S",
  regulatoryBody: "SEC",
  effectiveDate: "2026-12-01",
  status: "New",
  deadlines: [{ label: "File", date: "2026-12-05" }],
  reasonsRelevant: ["Because"],
};

async function* chunks(): AsyncGenerator<ChatStreamChunk> {
  yield { type: "reasoning-summary", summary: "Thinking" };
  yield { type: "reasoning-delta", delta: "a" };
  yield { type: "reasoning-delta", delta: "b" };
  yield { type: "tool-start", id: "t1", toolName: "Search", toolKind: "web_search" };
  yield { type: "tool-update", id: "t1", status: "success" };
  yield { type: "text-delta", delta: "H" };
  yield { type: "text-delta", delta: "i" };
  yield { type: "insight-list", items: [item] };
  yield { type: "finish" };
}

test("folds reasoning, tool lifecycle, text, and regulatory list into parts", async () => {
  const store = useChatMessagesStore.getState();
  store.setMessages("c1", []);
  store.appendMessage("c1", {
    id: "m1",
    role: "assistant",
    parts: [],
    status: "streaming",
    createdAt: new Date().toISOString(),
  });
  await streamAssistantMessage("c1", "m1", chunks(), new AbortController().signal);
  const message = useChatMessagesStore.getState().messagesByChatId.c1[0];
  expect(message.parts.map((p) => p.type)).toEqual([
    "reasoning",
    "tool",
    "text",
    "insight-list",
  ]);
  const tool = message.parts[1];
  expect(tool.type === "tool" && tool.status).toBe("success");
  const list = message.parts[3];
  expect(list.type === "insight-list" && list.items).toEqual([item]);
  expect(message.status).toBe("done");
});
