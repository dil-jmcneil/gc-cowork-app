import { useChatMessagesStore } from "@/chat/chatMessagesStore";
import type { ChatMessage } from "@/chat/chatTypes";
import { sendUserMessage, stopAssistantReply } from "@/runtime/assistantReply";

const EMPTY_MESSAGES: ChatMessage[] = [];

export type ChatRuntime = {
  messages: ChatMessage[];
  sendMessage: (text: string) => void;
  stop: () => void;
  isStreaming: boolean;
};

/** A chat's messages plus send/stop, backed by the shared reply runtime. */
export function useChatRuntime(chatId: string): ChatRuntime {
  const messages = useChatMessagesStore((s) => s.messagesByChatId[chatId] ?? EMPTY_MESSAGES);
  const isStreaming = useChatMessagesStore((s) => Boolean(s.streamingChatIds[chatId]));
  return {
    messages,
    isStreaming,
    sendMessage: (text) => {
      sendUserMessage(chatId, text);
    },
    stop: () => stopAssistantReply(chatId),
  };
}
