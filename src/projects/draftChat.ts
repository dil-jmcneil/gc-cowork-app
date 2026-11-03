import { appendAssistantMessage, useChatMessagesStore } from "@/chat/chatMessagesStore";
import type { Insight } from "@/insights/insight";

/** Chat thread id for the Create workstream side panel; kept out of chat history. */
export function draftChatId(insightId: string): string {
  return `project-draft-${insightId}`;
}

export function seedDraftChat(insight: Insight): void {
  const id = draftChatId(insight.id);
  if (useChatMessagesStore.getState().messagesByChatId[id]?.length) return;
  appendAssistantMessage(
    id,
    `I drafted this workstream from "${insight.title}". Ask me to change the plan, add a task, or suggest an owner.`,
  );
}
