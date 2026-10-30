import type { ChatMessage, ChatPart, ChatRole } from "./chatTypes";

export function makeMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function extractTextFromParts(parts: ChatPart[]): string {
  return parts
    .filter((part): part is Extract<ChatPart, { type: "text" }> => part.type === "text")
    .map((part) => part.text)
    .join("\n\n");
}

export function createTextMessage(
  role: ChatRole,
  text: string,
  conversationId?: string,
): ChatMessage {
  return {
    id: makeMessageId(),
    conversationId,
    role,
    parts: [{ type: "text", text }],
    status: "done",
    createdAt: new Date().toISOString(),
  };
}

