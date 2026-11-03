import { LOGGED_IN_USER } from "@/user";

import { ownerShortName, type TaskOwner } from "./people";
import type { ProjectTask, TaskStatus } from "./project";
import { formatShortDate } from "./taskStatus";
import { makeMessageId, type HistoryAction, type HistoryFile, type TaskMessage } from "./thread";

const GC = LOGGED_IN_USER.firstName;

const firstName = ownerShortName;

/** "Review tools with HR" → "review tools with HR": only the first letter drops, so acronyms survive. */
function asPhrase(description: string): string {
  return description.charAt(0).toLowerCase() + description.slice(1);
}

export function coworkEmail(to: TaskOwner, subject: string, body: string, sentAt: string): TaskMessage {
  return {
    kind: "message",
    id: makeMessageId(),
    channel: "email",
    authorRole: "cowork",
    authorName: "Cowork",
    to: [to.label],
    subject,
    body,
    sentAt,
  };
}

/** Cowork's first email to the owner when a task is set up. */
export function assignmentEmail(task: ProjectTask, sentAt: string): TaskMessage {
  return coworkEmail(
    task.delegate,
    `New task: ${task.description}`,
    `Hi ${firstName(task.delegate)}, ${GC} asked me to set this up for you: ${asPhrase(task.description)}. It's due ${formatShortDate(task.deadline)}. Reply to this email with questions or updates.`,
    sentAt,
  );
}

/** A nudge from Cowork to the owner; `attempt` counts follow-ups against the circuit breaker. */
export function reminderEmail(task: ProjectTask, sentAt: string, attempt?: { n: number; of: number }): TaskMessage {
  const overdue = new Date(`${task.deadline}T00:00:00Z`) < new Date(sentAt);
  const when = overdue ? `was due ${formatShortDate(task.deadline)}` : `is due ${formatShortDate(task.deadline)}`;
  return coworkEmail(
    task.delegate,
    `Reminder: ${task.description}`,
    `Hi ${firstName(task.delegate)}, following up for ${GC}: "${task.description}" ${when}. Where does it stand?${attempt ? ` (Follow-up ${attempt.n} of ${attempt.of}.)` : ""}`,
    sentAt,
  );
}

/** Cowork emails the owner a message the GC wrote. */
export function messageEmail(task: ProjectTask, text: string, sentAt: string): TaskMessage {
  return coworkEmail(task.delegate, `Re: ${task.description}`, `${text}\n\n— Sent by Cowork for ${GC}`, sentAt);
}

/** Cowork passes on a note the GC left in chat. */
export function relayEmail(task: ProjectTask, note: string, sentAt: string): TaskMessage {
  return coworkEmail(
    task.delegate,
    `Re: ${task.description}`,
    `Hi ${firstName(task.delegate)}, a note from ${GC}: "${note}"`,
    sentAt,
  );
}

/** Cowork briefs a new owner after a reassignment. */
export function reassignmentEmail(task: ProjectTask, newOwner: TaskOwner, sentAt: string): TaskMessage {
  return coworkEmail(
    newOwner,
    `New task: ${task.description}`,
    `Hi ${firstName(newOwner)}, ${GC} gave this task to you: ${asPhrase(task.description)}. It's due ${formatShortDate(task.deadline)}. Reply here with any questions.`,
    sentAt,
  );
}

/** The GC changed a task's status. */
export function statusChangeNote(status: TaskStatus, sentAt: string): HistoryAction {
  return { kind: "action", id: makeMessageId(), actor: GC, summary: `Set the status to ${status}`, sentAt };
}

/** Something Cowork did, with the plan rule it applied when there is one. */
export function coworkAction(
  summary: string,
  sentAt: string,
  extra: { detail?: string; rule?: string } = {},
): HistoryAction {
  return { kind: "action", id: makeMessageId(), actor: "Cowork", summary, sentAt, ...extra };
}

/** A file added to the task. */
export function fileAdded(name: string, addedBy: string, sentAt: string, note?: string): HistoryFile {
  return { kind: "file", id: makeMessageId(), name, addedBy, sentAt, ...(note ? { note } : {}) };
}

/** Cowork tells the GC something in chat, such as which rule it applied. */
export function coworkNote(body: string, sentAt: string): TaskMessage {
  return {
    kind: "message",
    id: makeMessageId(),
    channel: "chat",
    authorRole: "cowork",
    authorName: "Cowork",
    to: [GC],
    body,
    sentAt,
  };
}

/** The GC's own message, added through the chat surface. */
export function gcChatMessage(text: string, sentAt: string): TaskMessage {
  return {
    kind: "message",
    id: makeMessageId(),
    channel: "chat",
    authorRole: "delegator",
    authorName: GC,
    body: text,
    sentAt,
  };
}

/** An owner's reply by email. */
export function ownerReply(owner: TaskOwner, body: string, sentAt: string, attachments?: string[]): TaskMessage {
  return {
    kind: "message",
    id: makeMessageId(),
    channel: "email",
    authorRole: "delegate",
    authorName: owner.label,
    to: ["Cowork"],
    body,
    sentAt,
    ...(attachments ? { attachments } : {}),
  };
}
