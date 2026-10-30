import { makeMessageId } from "@/chat/chatMessageUtils";
import { useChatMessagesStore } from "@/chat/chatMessagesStore";
import { streamMockReply } from "@/chat/mockChatAdapter";
import { streamAssistantMessage } from "@/runtime/streamAssistantMessage";

/**
 * One owner for every assistant reply, so the opening reply and follow-ups
 * share the same streaming flag and Stop. Replies keep streaming when the
 * thread unmounts; the store outlives the page.
 */
const controllers = new Map<string, AbortController>();

export function isChatStreaming(chatId: string): boolean {
  return Boolean(useChatMessagesStore.getState().streamingChatIds[chatId]);
}

/** Streams a mock reply to `prompt`. Returns false if a reply is already streaming. */
export function startAssistantReply(chatId: string, prompt: string): boolean {
  if (isChatStreaming(chatId)) return false;
  const store = useChatMessagesStore.getState();
  const assistantId = makeMessageId();
  store.appendMessage(chatId, {
    id: assistantId,
    conversationId: chatId,
    role: "assistant",
    parts: [],
    status: "streaming",
    createdAt: new Date().toISOString(),
  });

  const controller = new AbortController();
  controllers.set(chatId, controller);
  store.setStreaming(chatId, true);

  void streamAssistantMessage(
    chatId,
    assistantId,
    streamMockReply(prompt, controller.signal),
    controller.signal,
  ).finally(() => {
    if (controllers.get(chatId) === controller) controllers.delete(chatId);
    useChatMessagesStore.getState().setStreaming(chatId, false);
  });
  return true;
}

/** Appends the user's message and starts a reply. False when blank or busy. */
export function sendUserMessage(chatId: string, text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || isChatStreaming(chatId)) return false;
  useChatMessagesStore.getState().appendUserText(chatId, trimmed);
  return startAssistantReply(chatId, trimmed);
}

export function stopAssistantReply(chatId: string): void {
  controllers.get(chatId)?.abort();
}
