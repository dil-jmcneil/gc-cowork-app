import type { NavigateFunction } from "react-router";

import { useChatStore, type ChatRecord } from "./chatStore.js";

export function startChatFromPrompt(
  prompt: string,
  navigate: NavigateFunction,
  context: { workstreamId?: string } = {},
): ChatRecord | null {
  const trimmed = prompt.trim();
  if (!trimmed) return null;

  const chat = useChatStore.getState().createChat({ initialUserText: trimmed, ...context });
  navigate(`/chats/${chat.id}`);
  return chat;
}
