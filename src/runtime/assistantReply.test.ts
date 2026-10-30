import { useChatMessagesStore } from "@/chat/chatMessagesStore";
import { useChatStore } from "@/chat/chatStore";
import { SHOW_REGULATORY_CHANGES_PROMPT } from "@/home/quickActionPrompts";
import {
  isChatStreaming,
  sendUserMessage,
  stopAssistantReply,
} from "@/runtime/assistantReply";
import { initializeChatSession } from "@/runtime/useChatSession";

beforeEach(() => {
  useChatStore.setState({ chats: [], activeChatId: null });
  useChatMessagesStore.setState({ messagesByChatId: {} });
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

function messages(chatId: string) {
  return useChatMessagesStore.getState().messagesByChatId[chatId] ?? [];
}

test("opening reply counts as streaming until it finishes", async () => {
  const chat = useChatStore.getState().createChat({ initialUserText: "Hello there" });
  initializeChatSession(chat.id);
  expect(isChatStreaming(chat.id)).toBe(true);
  await vi.runAllTimersAsync();
  expect(isChatStreaming(chat.id)).toBe(false);
});

test("a follow-up can't start while the opening reply is streaming", async () => {
  const chat = useChatStore.getState().createChat({ initialUserText: SHOW_REGULATORY_CHANGES_PROMPT });
  initializeChatSession(chat.id);
  expect(sendUserMessage(chat.id, "another question")).toBe(false);
  await vi.runAllTimersAsync();
  expect(messages(chat.id).filter((m) => m.role === "user")).toHaveLength(1);
  expect(sendUserMessage(chat.id, "another question")).toBe(true);
});

test("stopping mid-tool does not mark the running tool as succeeded", async () => {
  const chat = useChatStore.getState().createChat({ initialUserText: SHOW_REGULATORY_CHANGES_PROMPT });
  initializeChatSession(chat.id);
  const reply = () => messages(chat.id).find((m) => m.role === "assistant")!;
  while (!reply().parts.some((p) => p.type === "tool")) {
    await vi.advanceTimersByTimeAsync(10);
  }
  stopAssistantReply(chat.id);
  await vi.runAllTimersAsync();
  const tools = reply().parts.filter((p) => p.type === "tool");
  expect(tools).toHaveLength(1);
  expect(tools[0].type === "tool" && tools[0].status).not.toBe("success");
  expect(reply().parts.some((p) => p.type === "regulatory-change-list")).toBe(false);
  expect(reply().status).toBe("done");
  expect(isChatStreaming(chat.id)).toBe(false);
});
