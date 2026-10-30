import type { ProjectTask } from "./project";

export type TaskAttention = "overdue" | "new-status";

const SHORT_DATE = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

export function formatShortDate(iso: string): string {
  return SHORT_DATE.format(new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso));
}

export function isTaskOverdue(task: ProjectTask, now: Date): boolean {
  return task.status !== "Done" && new Date(`${task.deadline}T00:00:00Z`) < now;
}

/** What a task needs from the GC right now, if anything. */
export function taskAttention(task: ProjectTask, now: Date): TaskAttention | undefined {
  if (task.status === "Done") return undefined;
  if (isTaskOverdue(task, now)) return "overdue";
  if (task.status === "In progress") return "new-status";
  return undefined;
}

function latestFromOwner(task: ProjectTask) {
  return [...task.thread].reverse().find((m) => m.authorRole === "delegate");
}

/** One or two sentences on where a task stands, from its status, deadline and thread. */
export function summarizeTask(task: ProjectTask, now: Date): string {
  if (task.statusSummary) return task.statusSummary;
  const owner = task.delegate.label;
  const reply = latestFromOwner(task);
  const due = formatShortDate(task.deadline);

  if (task.status === "Done") {
    return reply ? `${owner} marked this done on ${formatShortDate(reply.sentAt)}.` : `Done. ${owner} closed it out.`;
  }
  if (isTaskOverdue(task, now)) {
    const reminders = task.thread.filter((m) => m.authorRole === "cowork" && /reminder|following up/i.test(m.body)).length;
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
