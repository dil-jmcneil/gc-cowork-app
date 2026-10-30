import { appendAssistantMessage, useChatMessagesStore } from "@/chat/chatMessagesStore";

import type { ProjectTask } from "./project";
import { useProjectStore } from "./projectStore";
import { summarizeTask } from "./taskStatus";

const STATUS_QUESTION = /\b(status|stand|update|where|progress|how'?s it going)\b|\?$/i;

/** Chat thread id for a task's side panel; kept out of chat history. */
export function taskChatId(taskId: string): string {
  return `task-${taskId}`;
}

export function seedTaskChat(task: ProjectTask): void {
  const id = taskChatId(task.id);
  if (useChatMessagesStore.getState().messagesByChatId[id]?.length) return;
  appendAssistantMessage(
    id,
    `I'm keeping track of this with ${task.delegate.label}. Ask me where it stands, or tell me what to pass on and I'll email it.`,
  );
}

/**
 * Cowork's reply to a message in a task's chat panel. A status question gets
 * the status summary; anything else is recorded in the task's thread and
 * passed on to the owner by email.
 */
export function handleTaskChatMessage(projectId: string, taskId: string, text: string, now: Date): string {
  const store = useProjectStore.getState();
  const task = store.getTask(projectId, taskId);
  if (!task) return "I can't find that task anymore.";

  if (STATUS_QUESTION.test(text.trim())) return summarizeTask(task, now);

  store.addChatNote(projectId, taskId, text.trim());
  return `Got it. I added your note to the thread and emailed it to ${task.delegate.label}.`;
}
