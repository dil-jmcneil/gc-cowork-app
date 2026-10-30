import { deriveTitleFromPrompt, useChatStore } from "@/chat/chatStore";
import { startChatFromPrompt } from "@/chat/startChat";

beforeEach(() => useChatStore.setState({ chats: [], activeChatId: null }));

test("createChat derives sentence-case title and preview", () => {
  const chat = useChatStore
    .getState()
    .createChat({ initialUserText: "show recent regulatory changes." });
  expect(chat.title).toBe("Show recent regulatory changes");
  expect(chat.preview).toBe("show recent regulatory changes.");
  expect(useChatStore.getState().chats[0]).toBe(chat);
});

test("deriveTitleFromPrompt truncates", () => {
  const title = deriveTitleFromPrompt("a".repeat(120));
  expect(title).toHaveLength(80);
  expect(title.endsWith("…")).toBe(true);
});

test("startChatFromPrompt ignores blank", () => {
  const navigate = vi.fn();
  expect(startChatFromPrompt("   ", navigate)).toBeNull();
  expect(useChatStore.getState().chats).toHaveLength(0);
  expect(navigate).not.toHaveBeenCalled();
});

test("startChatFromPrompt navigates to chat", () => {
  const navigate = vi.fn();
  const chat = startChatFromPrompt("Research a rule", navigate);
  expect(chat).not.toBeNull();
  expect(navigate).toHaveBeenCalledWith(`/chats/${chat!.id}`);
});
