import { capSupport, type Summary } from "./summary";
import { currentMilestone } from "./milestones";
import { formatShortDate, isTaskOverdue, summarizeTask, taskActivity } from "./taskStatus";
import { isMessage } from "./thread";
import type { Workstream, WorkstreamTask } from "./workstream";

/** Something on the workstream that needs a person to move: you, or an owner you can nudge. */
export type AttentionItem = {
  task: WorkstreamTask;
  /** What clears it: you confirm the owner's work, or you nudge the owner. */
  action: "confirm" | "nudge";
  /** One line on what's going on, to show beside the action. */
  detail: string;
};

export type WorkstreamAttention = {
  summary: Summary;
  waitingOnYou: AttentionItem[];
  waitingOnOthers: AttentionItem[];
};

function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

/** Follow-ups Cowork sent since the owner last replied. */
function unansweredFollowUps(task: WorkstreamTask): number {
  const messages = task.history.filter(isMessage);
  const lastReply = messages.map((m) => m.authorRole).lastIndexOf("delegate");
  return messages
    .slice(lastReply + 1)
    .filter((m) => m.authorRole === "cowork" && m.channel === "email" && /^Reminder:/.test(m.subject ?? "")).length;
}

/** The headline for a task you need to review: the task's own prompt when the story has one. */
function reviewHeadline(task: WorkstreamTask): string {
  return (
    task.reviewPrompt ??
    `Review what ${task.delegate.label} sent for "${task.description}", then confirm it to close the task.`
  );
}

function nudgeHeadline(task: WorkstreamTask, now: Date): string {
  const owner = task.delegate.label;
  if (isTaskOverdue(task, now))
    return `Nudge ${owner}: "${task.description}" was due ${formatShortDate(task.deadline)}.`;
  const n = unansweredFollowUps(task);
  return `Nudge ${owner}: no reply on "${task.description}" after ${n} follow-up${n === 1 ? "" : "s"}.`;
}

/** Owners of open tasks in the milestone after this task's, who can't move until it's done. */
function heldUpBy(workstream: Workstream, task: WorkstreamTask): string | undefined {
  const { milestones, tasks } = workstream.plan;
  const next = milestones[milestones.findIndex((m) => m.id === task.milestoneId) + 1];
  if (!next) return undefined;
  const owners = [
    ...new Set(
      tasks.filter((t) => t.milestoneId === next.id && t.status === "Not started").map((t) => t.delegate.label),
    ),
  ];
  if (!owners.length) return undefined;
  return `${owners.join(" and ")} ${owners.length === 1 ? "is" : "are"} waiting on it.`;
}

function progressSummary(workstream: Workstream): Summary {
  const { tasks } = workstream.plan;
  const done = tasks.filter((t) => t.status === "Done").length;
  if (done === tasks.length) return { headline: "Everything on the plan is done.", support: [] };
  const next = tasks.filter((t) => t.status !== "Done").sort((a, b) => a.deadline.localeCompare(b.deadline))[0];
  const milestone = currentMilestone(workstream.plan.milestones, tasks);
  return {
    headline: `On track: ${done} of ${tasks.length} tasks done.`,
    support: capSupport([
      `Next up: ${lowerFirst(next.description)} (${next.delegate.label}, due ${formatShortDate(next.deadline)}).`,
      milestone ? `The current milestone is "${milestone.title}".` : undefined,
    ]),
  };
}

/**
 * What the workstream needs and from whom, with a summary that leads with it.
 * The headline is your next action when there is one, then the owner to
 * nudge, and only then progress.
 */
export function workstreamAttention(workstream: Workstream, now: Date): WorkstreamAttention {
  const open = workstream.plan.tasks
    .filter((t) => t.status !== "Done")
    .sort((a, b) => a.deadline.localeCompare(b.deadline));

  const waitingOnYou: AttentionItem[] = open
    .filter((t) => t.awaitingReview)
    .map((task) => ({ task, action: "confirm", detail: summarizeTask(task, now) }));

  const waitingOnOthers: AttentionItem[] = open
    .filter((t) => !t.awaitingReview && (isTaskOverdue(t, now) || unansweredFollowUps(t) > 0))
    .map((task) => ({ task, action: "nudge", detail: taskActivity(task, now) }));

  const [mine] = waitingOnYou;
  if (mine) {
    return {
      summary: {
        headline: reviewHeadline(mine.task),
        support: capSupport([mine.detail, heldUpBy(workstream, mine.task)]),
      },
      waitingOnYou,
      waitingOnOthers,
    };
  }
  const [theirs] = waitingOnOthers;
  if (theirs) {
    return {
      summary: { headline: nudgeHeadline(theirs.task, now), support: capSupport([theirs.detail]) },
      waitingOnYou,
      waitingOnOthers,
    };
  }
  return { summary: progressSummary(workstream), waitingOnYou, waitingOnOthers };
}
