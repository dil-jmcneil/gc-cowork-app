import type { ChatMessage } from "./chatTypes";

/** One conversational mark, independent of individual tool progress. */
export function brandActivityPlacement(messages: ChatMessage[]) {
  const last = messages[messages.length - 1];
  if (!last) return { kind: "none" } as const;
  const visibleParts = last.parts.filter((part) => part.type !== "source");
  const tail = visibleParts[visibleParts.length - 1];
  if (last.role === "assistant" && last.status === "streaming" && tail?.type === "reasoning") {
    return { kind: "working", messageId: last.id } as const;
  }
  return { kind: "below-message", working: last.role === "assistant" && last.status === "streaming" } as const;
}
