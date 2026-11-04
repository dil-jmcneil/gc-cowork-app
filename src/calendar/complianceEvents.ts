import type { Workstream, WorkstreamTask } from "@/workstreams/workstream";
import { isTaskOverdue, taskActivity, taskAttention } from "@/workstreams/taskStatus";
import { draftWorkstreamHref, workstreamHref } from "@/workstreams/links";
import { signalType, type PastWorkstream, type PastWorkstreamTask } from "@/signals/signal";
import { SIGNALS } from "@/signals/signals";

/** Task statuses, plus "External" for deadlines set outside the company. */
export type CalendarEventStatus = "Assigned" | "Complete" | "Blocked" | "External";

/**
 * The status label the timeline shows, ranked so the GC can see where to act:
 * Overdue, then Due soon, In progress, Not started, Done. External deadlines
 * read Deadline, or Needs a workstream when nobody has picked them up.
 */
export type EventPriority = {
  label:
    | "Needs your review"
    | "Overdue"
    | "Due soon"
    | "In progress"
    | "Not started"
    | "Done"
    | "Deadline"
    | "Needs a workstream";
  color: "error" | "warning" | "information" | "subtle" | "success";
};

/** Open tasks due within this many days read "Due soon". */
const DUE_SOON_DAYS = 7;

/** What the timeline's right-hand Attention slot shows for an event. */
export type CalendarEventAttention = "nudge" | "review" | "awaiting-response" | "new-status";

type EventBase = {
  id: string;
  /** ISO date, yyyy-mm-dd. */
  date: string;
  title: string;
  /** One-line status sentence, e.g. "Jordan Lee hasn't responded; past due, nudge recommended". */
  description: string;
  status: CalendarEventStatus;
  attention?: CalendarEventAttention;
  /** The signal or workstream this event belongs to. */
  source: string;
  /** Who owns it, when someone does. */
  owner?: string;
  /** Where opening the event goes: its workstream page, or the signal's draft. */
  href?: string;
  /** What opening the event shows, for the hover tooltip. */
  linkLabel: string;
  /** Suggested next step, for the hover tooltip. */
  nextStep: string;
  priority: EventPriority;
  /** One line on the latest status and activity, as Cowork would write it. */
  summary: string;
  /** The workstream the event belongs to, linked when it has a page. */
  workstream?: { name: string; href?: string };
};

export type CalendarEvent =
  | (EventBase & { kind: "task"; workstreamId: string; taskId: string })
  | (EventBase & { kind: "external"; signalId: string })
  /** A past workstream's task. No task dialog; its workstream link opens the signal. */
  | (EventBase & { kind: "reference"; signalId: string });

type TaskFacts = Pick<WorkstreamTask, "status" | "deadline" | "awaitingReview">;

function taskPriority(task: TaskFacts, now: Date): EventPriority {
  if (task.status === "Done") return { label: "Done", color: "success" };
  if (task.awaitingReview) return { label: "Needs your review", color: "warning" };
  if (isTaskOverdue(task, now)) return { label: "Overdue", color: "error" };
  const daysLeft = (new Date(`${task.deadline}T00:00:00Z`).getTime() - now.getTime()) / 86_400_000;
  if (daysLeft <= DUE_SOON_DAYS) return { label: "Due soon", color: "warning" };
  return task.status === "In progress"
    ? { label: "In progress", color: "information" }
    : { label: "Not started", color: "subtle" };
}

/** Status, attention, and copy for any task-like event, from its status, deadline and owner. */
function taskState(task: TaskFacts, owner: string, source: string, now: Date) {
  const priority = taskPriority(task, now);
  if (task.status === "Done") {
    return {
      priority,
      status: "Complete" as const,
      description: `${source} — ${owner} marked this done`,
      nextStep: "Nothing to do — ready to close",
    };
  }
  const attention = taskAttention(task, now);
  if (attention === "review") {
    return {
      priority,
      status: "Assigned" as const,
      attention: "review" as const,
      description: `${source} — ${owner} says it's done; your review closes it`,
      nextStep: "Review what was sent, then confirm to close the task",
    };
  }
  if (attention === "overdue") {
    return {
      priority,
      status: "Blocked" as const,
      attention: "nudge" as const,
      description: `${source} — ${owner} hasn't responded; past due, nudge recommended`,
      nextStep: `Nudge ${owner}, or reassign the task`,
    };
  }
  if (attention === "new-status") {
    return {
      priority,
      status: "Assigned" as const,
      attention: "new-status" as const,
      description: `${source} — ${owner} is working on it`,
      nextStep: `Review ${owner}'s update`,
    };
  }
  return {
    priority,
    status: "Assigned" as const,
    description: `${source} — assigned to ${owner}`,
    nextStep: `Wait for ${owner}, or check in before the deadline`,
  };
}

function taskEvent(workstream: Workstream, task: WorkstreamTask, now: Date): CalendarEvent {
  const owner = task.delegate.label;
  return {
    kind: "task",
    id: task.id,
    workstreamId: workstream.id,
    taskId: task.id,
    date: task.deadline,
    title: task.description,
    source: workstream.name,
    owner,
    href: workstreamHref(workstream.id, { milestoneId: task.milestoneId, taskId: task.id }),
    linkLabel: `Task in ${workstream.name}`,
    summary: taskActivity(task, now),
    workstream: { name: workstream.name, href: workstreamHref(workstream.id) },
    ...taskState(task, owner, workstream.name, now),
  };
}

/** A task of a past workstream: shown on the calendar, but it opens nothing. */
function referenceTaskEvent(
  signalId: string,
  workstream: PastWorkstream,
  task: PastWorkstreamTask,
  now: Date,
): CalendarEvent {
  return {
    kind: "reference",
    signalId,
    id: task.id,
    date: task.due,
    title: task.description,
    source: workstream.name,
    owner: task.owner,
    linkLabel: `Task in ${workstream.name}`,
    summary: task.statusSummary,
    // Past workstreams have no page; the link opens the signal, which shows the workstream.
    workstream: { name: workstream.name },
    ...taskState({ status: task.status, deadline: task.due }, task.owner, workstream.name, now),
  };
}

/**
 * Compliance calendar events: every signal deadline as an external
 * deadline, the tasks of past workstreams (display only), plus the tasks of
 * every workstream. A signal has no tasks until
 * its workstream exists.
 */
export function deriveCalendarEvents(workstreams: Workstream[], now: Date): CalendarEvent[] {
  const workstreamBySignal = new Map(workstreams.map((w) => [w.sourceSignalId, w]));

  const externalEvents: CalendarEvent[] = SIGNALS.flatMap((signal) =>
    signal.deadlines.map((deadline, index) => {
      const live = workstreamBySignal.get(signal.id);
      const hasWorkstream = Boolean(live) || Boolean(signal.pastWorkstream);
      const handled = hasWorkstream || Boolean(signal.outcome);
      return {
        kind: "external" as const,
        id: `${signal.id}-deadline-${index}`,
        signalId: signal.id,
        date: deadline.date,
        title: deadline.label,
        description: `${signal.title} · ${signal.source}`,
        status: "External" as const,
        ...(handled ? {} : { attention: "awaiting-response" as const }),
        priority: handled
          ? { label: "Deadline" as const, color: "subtle" as const }
          : { label: "Needs a workstream" as const, color: "warning" as const },
        summary: deadline.description ? `${signal.title}. ${deadline.description}` : signal.title,
        ...(live
          ? { workstream: { name: live.name, href: workstreamHref(live.id) } }
          : signal.pastWorkstream
            ? { workstream: { name: signal.pastWorkstream.name } }
            : {}),
        source: signal.title,
        href: live ? workstreamHref(live.id) : hasWorkstream ? "/" : draftWorkstreamHref(signal.id),
        linkLabel: `${signalType(signal)}: ${signal.title}`,
        nextStep: hasWorkstream
          ? "Track it through the workstream's tasks"
          : handled
            ? "Nothing to do — already reviewed"
            : "Create a workstream to assign owners",
      };
    }),
  );

  // A past workstream that's loaded as a real one lists its tasks below, with links.
  const referenceEvents = SIGNALS.flatMap((signal) =>
    signal.pastWorkstream && !workstreamBySignal.has(signal.id)
      ? signal.pastWorkstream.tasks.map((task) => referenceTaskEvent(signal.id, signal.pastWorkstream!, task, now))
      : [],
  );

  const taskEvents = workstreams.flatMap((workstream) =>
    workstream.plan.tasks.map((task) => taskEvent(workstream, task, now)),
  );

  return [...externalEvents, ...referenceEvents, ...taskEvents].sort((a, b) => a.date.localeCompare(b.date));
}
