import { useChatMessagesStore } from "@/chat/chatMessagesStore";
import { useChatStore } from "@/chat/chatStore";
import { draftChatId, seedDraftChat } from "@/workstreams/draftChat";
import { ATG_RULING } from "@/signals/signals";

beforeEach(() => {
  useChatStore.setState({ chats: [], activeChatId: null });
  useChatMessagesStore.setState({ messagesByChatId: {} });
});

test("seeds one welcome message that names the change, once", () => {
  seedDraftChat(ATG_RULING, 4);
  seedDraftChat(ATG_RULING, 4);
  const messages = useChatMessagesStore.getState().messagesByChatId[draftChatId(ATG_RULING.id)];
  expect(messages).toHaveLength(1);
  expect(messages[0].role).toBe("assistant");
  const part = messages[0].parts[0];
  expect(part.type === "text" && part.text).toContain(ATG_RULING.title);
});

test("doesn't add the draft chat to chat history", () => {
  seedDraftChat(ATG_RULING, 4);
  expect(useChatStore.getState().chats).toHaveLength(0);
});

test("the welcome says no one owns the tasks yet, and offers two next steps", () => {
  seedDraftChat(ATG_RULING, 4);
  const [message] = useChatMessagesStore.getState().messagesByChatId[draftChatId(ATG_RULING.id)];
  const text = message.parts.find((p) => p.type === "text");
  expect(text?.type === "text" && text.text).toMatch(/4-task plan/);
  expect(text?.type === "text" && text.text).toMatch(/No one owns the tasks yet/);
  const actions = message.parts.find((p) => p.type === "suggested-actions");
  expect(actions?.type === "suggested-actions" && actions.actions).toEqual([
    "Make changes to the plan",
    "Add owners to tasks",
  ]);
});
