import { useChatMessagesStore } from "@/chat/chatMessagesStore";
import { useChatStore } from "@/chat/chatStore";
import { draftChatId, seedDraftChat } from "@/projects/draftChat";
import { CYBER_RULE_CHANGE } from "@/regulatory/regulatoryChanges";

beforeEach(() => {
  useChatStore.setState({ chats: [], activeChatId: null });
  useChatMessagesStore.setState({ messagesByChatId: {} });
});

test("seeds one welcome message that names the change, once", () => {
  seedDraftChat(CYBER_RULE_CHANGE);
  seedDraftChat(CYBER_RULE_CHANGE);
  const messages = useChatMessagesStore.getState().messagesByChatId[draftChatId(CYBER_RULE_CHANGE.id)];
  expect(messages).toHaveLength(1);
  expect(messages[0].role).toBe("assistant");
  const part = messages[0].parts[0];
  expect(part.type === "text" && part.text).toContain(CYBER_RULE_CHANGE.title);
});

test("doesn't add the draft chat to chat history", () => {
  seedDraftChat(CYBER_RULE_CHANGE);
  expect(useChatStore.getState().chats).toHaveLength(0);
});
