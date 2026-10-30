import type { NavigateFunction } from "react-router";

import { useChatStore, type ChatRecord } from "./chatStore.js";

export function startChatFromPrompt(
  prompt: string,
  navigate: NavigateFunction,
): ChatRecord | null {
  const trimmed = prompt.trim();
  if (!trimmed) return null;

  const chat = useChatStore.getState().createChat({ initialUserText: trimmed });
  navigate(`/chats/${chat.id}`);
  return chat;
}
