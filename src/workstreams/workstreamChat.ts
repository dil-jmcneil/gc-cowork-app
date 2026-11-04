import { appendAssistantMessage, useChatMessagesStore } from "@/chat/chatMessagesStore";

import { planEditFromChat } from "./planChat";
import { summaryText } from "./summary";
import { CONFIRMS_DONE, STATUS_QUESTION } from "./taskChat";
import { summarizeTask } from "./taskStatus";
import type { Workstream } from "./workstream";
import { workstreamAttention } from "./workstreamAttention";
import { useWorkstreamStore } from "./workstreamStore";

const WAITING_ON_ME =
  /\b(waiting on (me|you)|my turn|on my plate|for me to do|what do i (need|have) to do|anything for me|need from me|blocked on me)\b/i;
const RELEVANCE = /\b(relevant|relevance|why (does|should) (this|it) matter|does (this|it) (apply|matter))\b/i;

/** Chat thread id for a workstream page's side panel; kept out of chat history. */
export function workstreamChatId(workstreamId: string): string {
  return `workstream-chat-${workstreamId}`;
}

/** The side chat opens with the status summary's headline, once per workstream. */
export function seedWorkstreamChat(workstream: Workstream, now: Date): void {
  const id = workstreamChatId(workstream.id);
  if (useChatMessagesStore.getState().messagesByChatId[id]?.length) return;
  appendAssistantMessage(
    id,
    `${workstreamAttention(workstream, now).summary.headline}\n\nAsk me what's waiting on you, why this matters, or what to change in the plan.`,
  );
}

/**
 * Cowork's reply to a message in the workstream page's chat. It confirms a
 * task waiting on the GC's review, edits the plan, says what's waiting on the
 * GC, and answers status and relevance questions. Returns undefined for
 * anything else, so the chat replies as usual.
 */
export function handleWorkstreamChatMessage(workstreamId: string, text: string, now: Date): string | undefined {
  const store = useWorkstreamStore.getState();
  const workstream = store.getWorkstream(workstreamId);
  if (!workstream) return "I can't find that workstream anymore.";
  const message = text.trim();
  const awaiting = workstream.plan.tasks.filter((t) => t.awaitingReview);

  if (awaiting.length && CONFIRMS_DONE.test(message)) {
    const task = awaiting[0];
    store.confirmTaskDone(workstream.id, task.id);
    return `Done. I closed "${task.description}" and recorded that you confirmed ${task.delegate.label}'s work.`;
  }

  const edit = planEditFromChat(workstream.plan, message);
  if (edit) {
    store.updatePlan(workstream.id, edit.plan);
    return edit.reply;
  }

  if (WAITING_ON_ME.test(message)) {
    if (!awaiting.length) return "Nothing's waiting on you right now. I'll tell you as soon as something is.";
    return awaiting
      .map(
        (t) =>
          `"${t.description}" is waiting on your review. ${summarizeTask(t, now)} Reply "Got it" once you've reviewed it, and I'll close it.`,
      )
      .join("\n\n");
  }

  if (RELEVANCE.test(message)) {
    return `Here's why it matters to Acme:\n\n${workstream.reasonsRelevant.map((r) => `- ${r}`).join("\n")}`;
  }

  if (STATUS_QUESTION.test(message)) return summaryText(workstreamAttention(workstream, now).summary);
  return undefined;
}
