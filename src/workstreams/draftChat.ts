import { makeMessageId } from "@/chat/chatMessageUtils";
import { useChatMessagesStore } from "@/chat/chatMessagesStore";
import type { ChatPart } from "@/chat/chatTypes";
import type { Signal } from "@/signals/signal";

import { ADD_OWNERS, MAKE_CHANGES } from "./ownerForm";

/** Chat thread id for the Create workstream side panel; kept out of chat history. */
export function draftChatId(signalId: string): string {
  return `workstream-draft-${signalId}`;
}

/** Cowork's opening message on a draft: the plan, that nobody owns it yet, and what to do next. */
export function draftIntroParts(signal: Signal, taskCount: number): ChatPart[] {
  return [
    {
      type: "text",
      text: `**I drafted a ${taskCount}-task plan for "${signal.title}".**\n\nNo one owns the tasks yet. Change the plan first, or add an owner to each task. I'll email them when you start.`,
    },
    { type: "suggested-actions", actions: [MAKE_CHANGES, ADD_OWNERS] },
  ];
}

export function seedDraftChat(signal: Signal, taskCount: number): void {
  const id = draftChatId(signal.id);
  const store = useChatMessagesStore.getState();
  if (store.messagesByChatId[id]?.length) return;
  store.appendMessage(id, {
    id: makeMessageId(),
    conversationId: id,
    role: "assistant",
    parts: draftIntroParts(signal, taskCount),
    status: "done",
    createdAt: new Date().toISOString(),
  });
}
