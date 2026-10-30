import { create } from "zustand";

export type ChatRecord = {
  id: string;
  title: string;
  initialUserText?: string;
  threadInitialized: boolean;
  createdAt: Date;
  lastActivity: Date;
  preview: string;
};

type CreateChatInput = {
  initialUserText?: string;
};

type ChatStoreState = {
  chats: ChatRecord[];
  activeChatId: string | null;
  createChat: (input?: CreateChatInput) => ChatRecord;
  setActiveChatId: (id: string | null) => void;
  getChat: (id: string) => ChatRecord | undefined;
  updateChat: (id: string, patch: Partial<ChatRecord>) => void;
};

/** Placeholder preview for a chat the user hasn't typed into yet. */
export const DEFAULT_CHAT_PREVIEW = "New conversation";

const DEFAULT_CHAT_TITLE = "New chat";

function makeId() {
  return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Short, sentence-case chat title from the opening prompt: trailing
 * punctuation dropped, capped at 80 characters so it fits nav labels.
 */
export function deriveTitleFromPrompt(prompt: string): string {
  const trimmed = prompt.trim().replace(/[.!?]+$/, "");
  if (!trimmed) return "";
  const head = trimmed.length > 80 ? `${trimmed.slice(0, 79)}…` : trimmed;
  return head.charAt(0).toUpperCase() + head.slice(1);
}

export const useChatStore = create<ChatStoreState>((set, get) => ({
  chats: [],
  activeChatId: null,

  createChat: (input = {}) => {
    const initialUserText = input.initialUserText?.trim() || undefined;
    const chat: ChatRecord = {
      id: makeId(),
      title: (initialUserText && deriveTitleFromPrompt(initialUserText)) || DEFAULT_CHAT_TITLE,
      initialUserText,
      threadInitialized: false,
      createdAt: new Date(),
      lastActivity: new Date(),
      preview: initialUserText ?? DEFAULT_CHAT_PREVIEW,
    };
    set((state) => ({ chats: [chat, ...state.chats], activeChatId: chat.id }));
    return chat;
  },

  setActiveChatId: (id) => set({ activeChatId: id }),

  getChat: (id) => get().chats.find((c) => c.id === id),

  updateChat: (id, patch) =>
    set((state) => ({
      chats: state.chats.map((c) =>
        c.id === id ? { ...c, ...patch, lastActivity: new Date() } : c,
      ),
    })),
}));
