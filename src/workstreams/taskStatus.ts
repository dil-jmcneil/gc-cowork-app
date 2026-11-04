import type { WorkstreamTask } from "./workstream";
import { isMessage } from "./thread";

export type TaskAttention = "overdue" | "review" | "new-status";

const SHORT_DATE = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

export function formatShortDate(iso: string): string {
  return SHORT_DATE.format(new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso));
}

export function isTaskOverdue(task: Pick<WorkstreamTask, "status" | "deadline">, now: Date): boolean {
  return task.status !== "Done" && new Date(`${task.deadline}T00:00:00Z`) < now;
}

/** What a task needs from the GC right now, if anything. */
export function taskAttention(
  task: Pick<WorkstreamTask, "status" | "deadline" | "awaitingReview">,
  now: Date,
): TaskAttention | undefined {
  if (task.status === "Done") return undefined;
  // Waiting on the GC outranks overdue: the owner has delivered.
  if (task.awaitingReview) return "review";
  if (isTaskOverdue(task, now)) return "overdue";
  if (task.status === "In progress") return "new-status";
  return undefined;
}

/** The five statuses a task shows in the plan. */
export type TaskDisplayLabel = "Not started" | "In progress" | "Needs your review" | "Blocked" | "Done";

export type TaskDisplayStatus = {
  label: TaskDisplayLabel;
  /** For Blocked: "you", or the owner of the task it waits on. */
  blockedBy?: string;
};

/**
 * What a task shows: Needs your review when its owner says it's done, Blocked
 * while the task it waits on is unfinished, otherwise its own status.
 */
export function taskDisplayStatus(
  task: Pick<WorkstreamTask, "status" | "awaitingReview" | "waitingOn">,
  tasks: Pick<WorkstreamTask, "id" | "status" | "awaitingReview" | "delegate">[],
): TaskDisplayStatus {
  if (task.status === "Done") return { label: "Done" };
  if (task.awaitingReview) return { label: "Needs your review" };
  const blocker = task.waitingOn ? tasks.find((t) => t.id === task.waitingOn) : undefined;
  if (blocker && blocker.status !== "Done") {
    return { label: "Blocked", blockedBy: blocker.awaitingReview ? "you" : blocker.delegate.label };
  }
  return { label: task.status };
}

function latestFromOwner(task: WorkstreamTask) {
  return task.history
    .filter(isMessage)
    .reverse()
    .find((m) => m.authorRole === "delegate");
}

/** One or two sentences on where a task stands, from its status, deadline and history. */
export function summarizeTask(task: WorkstreamTask, now: Date): string {
  if (task.statusSummary) return task.statusSummary;
  const owner = task.delegate.label;
  const reply = latestFromOwner(task);
  const due = formatShortDate(task.deadline);

  if (task.status === "Done") {
    return reply ? `${owner} marked this done on ${formatShortDate(reply.sentAt)}.` : `Done. ${owner} closed it out.`;
  }
  if (isTaskOverdue(task, now)) {
    const reminders = task.history
      .filter(isMessage)
      .filter((m) => m.authorRole === "cowork" && /reminder|following up/i.test(m.body)).length;
    const chased = reminders > 0 ? ` after ${reminders} reminder${reminders === 1 ? "" : "s"}` : "";
    return `Past due since ${due}. ${owner} hasn't responded${chased} — a nudge is recommended.`;
  }
  if (task.status === "In progress") {
    return reply
      ? `${owner} is working on it. Latest update, ${formatShortDate(reply.sentAt)}: "${reply.body}"`
      : `${owner} is working on it. Due ${due}.`;
  }
  return `Assigned to ${owner}. Due ${due}.`;
}

function clip(text: string, max = 100): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/**
 * One line on a task's latest activity, written to follow the owner's name
 * (the calendar shows the name first, so this never repeats it).
 */
export function taskActivity(task: WorkstreamTask, now: Date): string {
  if (task.statusSummary) return task.statusSummary;
  const reply = latestFromOwner(task);
  const due = formatShortDate(task.deadline);

  if (task.status === "Done") return reply ? `Marked done ${formatShortDate(reply.sentAt)}.` : "Done.";
  if (isTaskOverdue(task, now)) {
    const reminders = task.history
      .filter(isMessage)
      .filter((m) => m.authorRole === "cowork" && /reminder|following up/i.test(m.body)).length;
    const chased = reminders > 0 ? ` after ${reminders} reminder${reminders === 1 ? "" : "s"}` : "";
    return `Past due since ${due}, with no reply${chased}. A nudge is recommended.`;
  }
  if (reply) return `Latest update ${formatShortDate(reply.sentAt)}: "${clip(reply.body)}"`;
  if (task.status === "In progress") return `Working on it. Due ${due}.`;
  const assigned = task.history[0]?.sentAt;
  return assigned ? `Assigned ${formatShortDate(assigned)}, no reply yet. Due ${due}.` : `Not started. Due ${due}.`;
}
