import { useCallback, useEffect, useRef, useState } from "react";

import { makeMessageId } from "@/chat/chatMessageUtils";
import { useChatMessagesStore } from "@/chat/chatMessagesStore";
import type { ChatMessage } from "@/chat/chatTypes";
import { streamMockReply } from "@/chat/mockChatAdapter";
import { streamAssistantMessage } from "@/runtime/streamAssistantMessage";

const EMPTY_MESSAGES: ChatMessage[] = [];

export type ChatRuntime = {
  messages: ChatMessage[];
  sendMessage: (text: string) => Promise<void>;
  stop: () => void;
  isStreaming: boolean;
};

/**
 * Drives a chat conversation: appends the user message, opens the mock adapter
 * stream, and folds streamed chunks into a single assistant message's parts.
 */
export function useChatRuntime(chatId: string): ChatRuntime {
  const messages = useChatMessagesStore(
    (s) => s.messagesByChatId[chatId] ?? EMPTY_MESSAGES,
  );
  const appendMessage = useChatMessagesStore((s) => s.appendMessage);
  const appendUserText = useChatMessagesStore((s) => s.appendUserText);

  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Abort any in-flight stream when the chat changes or the thread unmounts.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, [chatId]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      appendUserText(chatId, trimmed);

      const assistantId = makeMessageId();
      appendMessage(chatId, {
        id: assistantId,
        conversationId: chatId,
        role: "assistant",
        parts: [],
        status: "streaming",
        createdAt: new Date().toISOString(),
      });

      const controller = new AbortController();
      abortRef.current = controller;
      setIsStreaming(true);

      try {
        await streamAssistantMessage(
          chatId,
          assistantId,
          streamMockReply(trimmed, controller.signal),
          controller.signal,
        );
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
        setIsStreaming(false);
      }
    },
    [appendMessage, appendUserText, chatId],
  );

  return { messages, sendMessage, stop, isStreaming };
}
