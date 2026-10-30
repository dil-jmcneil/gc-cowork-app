import { create } from "zustand";

import { createTextMessage } from "./chatMessageUtils";
import type { ChatMessage } from "./chatTypes";

type ChatMessagesState = {
  messagesByChatId: Record<string, ChatMessage[]>;
  setMessages: (chatId: string, messages: ChatMessage[]) => void;
  appendMessage: (chatId: string, message: ChatMessage) => void;
  appendUserText: (chatId: string, text: string) => void;
  appendAssistantText: (chatId: string, text: string) => void;
  updateMessage: (
    chatId: string,
    messageId: string,
    updater: (message: ChatMessage) => ChatMessage,
  ) => void;
};

export const useChatMessagesStore = create<ChatMessagesState>((set, get) => ({
  messagesByChatId: {},
  setMessages: (chatId, messages) =>
    set((state) => ({
      messagesByChatId: { ...state.messagesByChatId, [chatId]: messages },
    })),
  appendMessage: (chatId, message) =>
    set((state) => ({
      messagesByChatId: {
        ...state.messagesByChatId,
        [chatId]: [...(state.messagesByChatId[chatId] ?? []), message],
      },
    })),
  appendUserText: (chatId, text) => {
    get().appendMessage(chatId, createTextMessage("user", text, chatId));
  },
  appendAssistantText: (chatId, text) => {
    get().appendMessage(chatId, createTextMessage("assistant", text, chatId));
  },
  updateMessage: (chatId, messageId, updater) =>
    set((state) => {
      const messages = state.messagesByChatId[chatId];
      if (!messages) return state;
      return {
        messagesByChatId: {
          ...state.messagesByChatId,
          [chatId]: messages.map((message) =>
            message.id === messageId ? updater(message) : message,
          ),
        },
      };
    }),
}));

export function appendUserMessage(chatId: string, text: string): void {
  useChatMessagesStore.getState().appendUserText(chatId, text);
}

export function appendAssistantMessage(chatId: string, text: string): void {
  useChatMessagesStore.getState().appendAssistantText(chatId, text);
}
