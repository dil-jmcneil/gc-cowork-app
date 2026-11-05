import { appendAssistantMessage, useChatMessagesStore } from "@/chat/chatMessagesStore";

import type { WorkstreamTask } from "./workstream";
import { useWorkstreamStore } from "./workstreamStore";
import { summarizeTask } from "./taskStatus";

/** A reply that confirms an owner's "done", e.g. "Got it", "Looks good, close it", "Confirmed". */
export const CONFIRMS_DONE = /\b(got it|confirm(ed)?|looks good|approved?|close (it|the task)|mark (it )?(as )?done|received)\b/i;

export const STATUS_QUESTION = /\b(status|stand|update|where|progress|how'?s it going)\b|\?$/i;

/** Chat thread id for a task's side panel; kept out of chat history. */
export function taskChatId(taskId: string): string {
  return `task-${taskId}`;
}

export function seedTaskChat(task: WorkstreamTask): void {
  const id = taskChatId(task.id);
  if (useChatMessagesStore.getState().messagesByChatId[id]?.length) return;
  appendAssistantMessage(
    id,
    `I'm keeping track of this with ${task.delegate.label}. Ask me where it stands, or tell me what to pass on and I'll email it.`,
  );
}

/**
 * Cowork's reply to a message in a task's chat panel. When the task is waiting
 * on the GC's review, a confirming reply closes it. A status question gets the
 * status summary; anything else is recorded in the task's thread and passed
 * on to the owner by email.
 */
export function handleTaskChatMessage(workstreamId: string, taskId: string, text: string, now: Date): string {
  const store = useWorkstreamStore.getState();
  const task = store.getTask(workstreamId, taskId);
  if (!task) return "I can't find that task anymore.";

  if (task.awaitingReview && CONFIRMS_DONE.test(text.trim())) {
    store.confirmTaskDone(workstreamId, taskId);
    return `Done. I closed the task and recorded that you confirmed ${task.delegate.label}'s work.`;
  }
  if (STATUS_QUESTION.test(text.trim())) return summarizeTask(task, now);

  store.addChatNote(workstreamId, taskId, text.trim());
  return `Got it. I added your note to the thread and emailed it to ${task.delegate.label}.`;
}
