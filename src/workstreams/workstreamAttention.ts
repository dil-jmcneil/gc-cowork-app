import { capSupport, type Summary } from "./summary";
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

/**
 * How the status summary is colored, with Atlas status colors: warning when a
 * step waits on you (human in the loop), error when something is blocking the
 * work, information when it's on track. Waiting on you wins, since that's the
 * headline.
 */
export type SummaryTone = "warning" | "error" | "information";

/** The status panel's two sentences: what's been done, then what's next, with any blocker. */
export type StatusSentences = { done: string; next?: string };

/** One blocked or delayed task and the action it needs, for the panel's list. */
export type ActionLine = { task: WorkstreamTask; text: string; action: AttentionItem["action"] };

export type WorkstreamAttention = {
  summary: Summary;
  status: StatusSentences;
  /** Each blocked or delayed task and what it needs, yours first. No buttons: the task below has them. */
  actions: ActionLine[];
  tone: SummaryTone;
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

/** Names of the owners of open tasks that wait on this one. */
function heldUpOwners(workstream: Workstream, task: WorkstreamTask): string {
  const owners = [
    ...new Set(
      workstream.plan.tasks.filter((t) => t.waitingOn === task.id && t.status !== "Done").map((t) => t.delegate.label),
    ),
  ];
  return owners.length > 1 ? `${owners.slice(0, -1).join(", ")} and ${owners[owners.length - 1]}` : (owners[0] ?? "");
}

function stripPeriod(text: string): string {
  return text.replace(/\.$/, "");
}

/** Sentence one: what has been done so far. */
function doneSentence(workstream: Workstream): string {
  const { tasks } = workstream.plan;
  const done = tasks.filter((t) => t.status === "Done");
  if (done.length === tasks.length) return "Everything on the plan is done.";
  if (!done.length) return `Cowork has sent all ${tasks.length} tasks to their owners.`;
  const latest = [...done].sort((a, b) => b.deadline.localeCompare(a.deadline))[0];
  return `${done.length} of ${tasks.length} tasks are done, most recently "${latest.description}".`;
}

/** Sentence two: what's next, leading with whatever blocks it. */
function nextSentence(workstream: Workstream, now: Date, mine?: WorkstreamTask, theirs?: WorkstreamTask): string | undefined {
  if (mine) {
    const held = heldUpOwners(workstream, mine);
    const todo = lowerFirst(reviewHeadline(mine));
    return held ? `Your review is holding up ${held}: ${todo}` : `Next, you need to ${todo}`;
  }
  if (theirs) {
    const held = heldUpOwners(workstream, theirs);
    const why = isTaskOverdue(theirs, now)
      ? `"${theirs.description}" was due ${formatShortDate(theirs.deadline)}`
      : `hasn't replied on "${theirs.description}" after ${unansweredFollowUps(theirs)} follow-ups`;
    const owner = theirs.delegate.label;
    return `${isTaskOverdue(theirs, now) ? `${owner} is behind: ` : `${owner} `}${why}${held ? `, and ${held} can't move until it's done` : ""}.`;
  }
  const open = workstream.plan.tasks.filter((t) => t.status !== "Done");
  if (!open.length) return undefined;
  const next = open.sort((a, b) => a.deadline.localeCompare(b.deadline))[0];
  return `Next up: ${lowerFirst(next.description)} (${next.delegate.label}, due ${formatShortDate(next.deadline)}).`;
}

/** The action a blocked or delayed task needs, in a line. */
function actionText(item: AttentionItem, now: Date): string {
  const { task } = item;
  if (item.action === "confirm") return `You: ${lowerFirst(stripPeriod(reviewHeadline(task)))}.`;
  const first = task.delegate.label.split(" ")[0];
  return isTaskOverdue(task, now)
    ? `Nudge ${first}: due ${formatShortDate(task.deadline)}, not done yet.`
    : `Nudge ${first}: no reply after ${unansweredFollowUps(task)} follow-ups.`;
}

/** Owners of open tasks that wait on this one, who can't move until it's done. */
function heldUpBy(workstream: Workstream, task: WorkstreamTask): string | undefined {
  const owners = [
    ...new Set(
      workstream.plan.tasks.filter((t) => t.waitingOn === task.id && t.status !== "Done").map((t) => t.delegate.label),
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
  return {
    headline: `On track: ${done} of ${tasks.length} tasks done.`,
    support: capSupport([
      `Next up: ${lowerFirst(next.description)} (${next.delegate.label}, due ${formatShortDate(next.deadline)}).`,
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

  const status: StatusSentences = {
    done: doneSentence(workstream),
    next: nextSentence(workstream, now, waitingOnYou[0]?.task, waitingOnOthers[0]?.task),
  };
  const actions = [...waitingOnYou, ...waitingOnOthers].map((item) => ({ task: item.task, action: item.action, text: actionText(item, now) }));

  const [mine] = waitingOnYou;
  if (mine) {
    return {
      summary: {
        headline: reviewHeadline(mine.task),
        support: capSupport([mine.detail, heldUpBy(workstream, mine.task)]),
      },
      tone: "warning",
      status,
      actions,
      waitingOnYou,
      waitingOnOthers,
    };
  }
  const [theirs] = waitingOnOthers;
  if (theirs) {
    return {
      summary: { headline: nudgeHeadline(theirs.task, now), support: capSupport([theirs.detail]) },
      tone: "error",
      status,
      actions,
      waitingOnYou,
      waitingOnOthers,
    };
  }
  return { summary: progressSummary(workstream), tone: "information", status, actions, waitingOnYou, waitingOnOthers };
}

export type WorkstreamStatus = {
  label: "Needs your review" | "At risk" | "On track" | "Done";
  color: "warning" | "error" | "information" | "success";
};

/** One badge for the whole workstream, in the same Atlas status color as its summary. */
export function workstreamStatus(workstream: Workstream, now: Date): WorkstreamStatus {
  if (workstream.plan.tasks.every((t) => t.status === "Done")) return { label: "Done", color: "success" };
  const { tone } = workstreamAttention(workstream, now);
  if (tone === "warning") return { label: "Needs your review", color: "warning" };
  if (tone === "error") return { label: "At risk", color: "error" };
  return { label: "On track", color: "information" };
}
