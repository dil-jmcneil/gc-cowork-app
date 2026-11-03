import { appendAssistantMessage, useChatMessagesStore } from "@/chat/chatMessagesStore";
import type { Signal } from "@/signals/signal";

/** Chat thread id for the Create workstream side panel; kept out of chat history. */
export function draftChatId(signalId: string): string {
  return `workstream-draft-${signalId}`;
}

export function seedDraftChat(signal: Signal): void {
  const id = draftChatId(signal.id);
  if (useChatMessagesStore.getState().messagesByChatId[id]?.length) return;
  appendAssistantMessage(
    id,
    `I drafted this workstream from "${signal.title}". Ask me to change the plan, add a task, or suggest an owner.`,
  );
}
