import { appendAssistantMessage, useChatMessagesStore } from "@/chat/chatMessagesStore";
import type { RegulatoryChange } from "@/regulatory/regulatoryChange";

/** Chat thread id for the Create project side panel; kept out of chat history. */
export function draftChatId(changeId: string): string {
  return `project-draft-${changeId}`;
}

export function seedDraftChat(change: RegulatoryChange): void {
  const id = draftChatId(change.id);
  if (useChatMessagesStore.getState().messagesByChatId[id]?.length) return;
  appendAssistantMessage(
    id,
    `I drafted this project from "${change.title}". Ask me to change the plan, add a task, or suggest an owner.`,
  );
}
