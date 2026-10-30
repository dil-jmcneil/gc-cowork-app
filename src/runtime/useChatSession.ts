import { useEffect } from "react";

import { makeMessageId } from "@/chat/chatMessageUtils";
import {
  appendAssistantMessage,
  appendUserMessage,
  useChatMessagesStore,
} from "@/chat/chatMessagesStore";
import { useChatStore } from "@/chat/chatStore";
import { streamMockReply } from "@/chat/mockChatAdapter";
import { streamAssistantMessage } from "@/runtime/streamAssistantMessage";

const WELCOME_MESSAGE =
  "Hi, I'm Cowork. I can track regulatory changes, research rules, and keep an eye on what's due. What would you like to work on?";

/**
 * Seeds a chat the first time it opens: the opening prompt plus a streamed
 * reply, or a welcome message for an empty chat. Safe to call repeatedly.
 */
export function initializeChatSession(chatId: string): void {
  const chats = useChatStore.getState();
  chats.setActiveChatId(chatId);
  const chat = chats.getChat(chatId);
  if (!chat || chat.threadInitialized) return;

  // Flag first, synchronously, so StrictMode's double effect can't seed twice.
  chats.updateChat(chatId, { threadInitialized: true });

  if (!chat.initialUserText) {
    appendAssistantMessage(chatId, WELCOME_MESSAGE);
    return;
  }

  appendUserMessage(chatId, chat.initialUserText);
  const assistantId = makeMessageId();
  useChatMessagesStore.getState().appendMessage(chatId, {
    id: assistantId,
    conversationId: chatId,
    role: "assistant",
    parts: [],
    status: "streaming",
    createdAt: new Date().toISOString(),
  });

  const controller = new AbortController();
  void streamAssistantMessage(
    chatId,
    assistantId,
    streamMockReply(chat.initialUserText, controller.signal),
    controller.signal,
  );
}

/** Initializes a chat session when opening `/chats/:chatId`. */
export function useChatSession(chatId: string | undefined): void {
  useEffect(() => {
    if (chatId) initializeChatSession(chatId);
  }, [chatId]);
}
