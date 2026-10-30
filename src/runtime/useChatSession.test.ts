import { useChatMessagesStore } from "@/chat/chatMessagesStore";
import { useChatStore } from "@/chat/chatStore";
import { initializeChatSession } from "@/runtime/useChatSession";

beforeEach(() => {
  useChatStore.setState({ chats: [], activeChatId: null });
  useChatMessagesStore.setState({ messagesByChatId: {} });
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

test("initializeChatSession is idempotent", async () => {
  const chat = useChatStore.getState().createChat({ initialUserText: "Hello there" });
  initializeChatSession(chat.id);
  initializeChatSession(chat.id);
  await vi.runAllTimersAsync();
  const messages = useChatMessagesStore.getState().messagesByChatId[chat.id];
  expect(messages.filter((m) => m.role === "user")).toHaveLength(1);
  const assistant = messages.filter((m) => m.role === "assistant");
  expect(assistant).toHaveLength(1);
  expect(assistant[0].status).toBe("done");
});

test("empty chat gets welcome message", () => {
  const chat = useChatStore.getState().createChat();
  initializeChatSession(chat.id);
  const messages = useChatMessagesStore.getState().messagesByChatId[chat.id];
  expect(messages.filter((m) => m.role === "assistant")).toHaveLength(1);
  expect(messages.filter((m) => m.role === "user")).toHaveLength(0);
});
