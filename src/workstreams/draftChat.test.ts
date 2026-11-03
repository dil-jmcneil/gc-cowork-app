import { useChatMessagesStore } from "@/chat/chatMessagesStore";
import { useChatStore } from "@/chat/chatStore";
import { draftChatId, seedDraftChat } from "@/workstreams/draftChat";
import { ATG_RULING } from "@/insights/insights";

beforeEach(() => {
  useChatStore.setState({ chats: [], activeChatId: null });
  useChatMessagesStore.setState({ messagesByChatId: {} });
});

test("seeds one welcome message that names the change, once", () => {
  seedDraftChat(ATG_RULING);
  seedDraftChat(ATG_RULING);
  const messages = useChatMessagesStore.getState().messagesByChatId[draftChatId(ATG_RULING.id)];
  expect(messages).toHaveLength(1);
  expect(messages[0].role).toBe("assistant");
  const part = messages[0].parts[0];
  expect(part.type === "text" && part.text).toContain(ATG_RULING.title);
});

test("doesn't add the draft chat to chat history", () => {
  seedDraftChat(ATG_RULING);
  expect(useChatStore.getState().chats).toHaveLength(0);
});
