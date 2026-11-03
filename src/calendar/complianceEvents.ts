import type { Workstream, WorkstreamTask } from "@/workstreams/workstream";
import { taskAttention } from "@/workstreams/taskStatus";
import { signalType, type PastWorkstream, type PastWorkstreamTask } from "@/signals/signal";
import { SIGNALS } from "@/signals/signals";

/** Task statuses, plus "External" for deadlines set outside the company. */
export type CalendarEventStatus = "Assigned" | "Complete" | "Blocked" | "External";

/** What the timeline's right-hand Attention slot shows for an event. */
export type CalendarEventAttention = "nudge" | "awaiting-response" | "new-status";

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
  /** Fallback link when the event isn't opened in an overlay. */
  href?: string;
  /** What opening the event shows, for the hover tooltip. */
  linkLabel: string;
  /** Suggested next step, for the hover tooltip. */
  nextStep: string;
};

export type CalendarEvent =
  | (EventBase & { kind: "task"; workstreamId: string; taskId: string })
  | (EventBase & { kind: "external"; signalId: string })
  /** A past workstream's task. Display only: no dialog or page. */
  | (EventBase & { kind: "reference" });

type TaskFacts = Pick<WorkstreamTask, "status" | "deadline">;

/** Status, attention, and copy for any task-like event, from its status, deadline and owner. */
function taskState(task: TaskFacts, owner: string, source: string, now: Date) {
  if (task.status === "Done") {
    return {
      status: "Complete" as const,
      description: `${source} — ${owner} marked this done`,
      nextStep: "Nothing to do — ready to close",
    };
  }
  const attention = taskAttention(task, now);
  if (attention === "overdue") {
    return {
      status: "Blocked" as const,
      attention: "nudge" as const,
      description: `${source} — ${owner} hasn't responded; past due, nudge recommended`,
      nextStep: `Nudge ${owner}, or reassign the task`,
    };
  }
  if (attention === "new-status") {
    return {
      status: "Assigned" as const,
      attention: "new-status" as const,
      description: `${source} — ${owner} is working on it`,
      nextStep: `Review ${owner}'s update`,
    };
  }
  return {
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
    href: `/workstreams/${workstream.id}/tasks/${task.id}`,
    linkLabel: `Task in ${workstream.name}`,
    ...taskState(task, owner, workstream.name, now),
  };
}

/** A task of a past workstream: shown on the calendar, but it opens nothing. */
function referenceTaskEvent(workstream: PastWorkstream, task: PastWorkstreamTask, now: Date): CalendarEvent {
  return {
    kind: "reference",
    id: task.id,
    date: task.due,
    title: task.description,
    source: workstream.name,
    owner: task.owner,
    linkLabel: `Task in ${workstream.name}`,
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
  const workstreamChangeIds = new Set(workstreams.map((p) => p.sourceSignalId));

  const externalEvents: CalendarEvent[] = SIGNALS.flatMap((signal) =>
    signal.deadlines.map((deadline, index) => {
      const hasWorkstream = workstreamChangeIds.has(signal.id) || Boolean(signal.pastWorkstream);
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
        source: signal.title,
        href: hasWorkstream ? "/" : `/workstreams/new?signal=${encodeURIComponent(signal.id)}`,
        linkLabel: `${signalType(signal)}: ${signal.title}`,
        nextStep: hasWorkstream
          ? "Track it through the workstream's tasks"
          : handled
            ? "Nothing to do — already reviewed"
            : "Create a workstream to assign owners",
      };
    }),
  );

  const referenceEvents = SIGNALS.flatMap((signal) =>
    signal.pastWorkstream
      ? signal.pastWorkstream.tasks.map((task) => referenceTaskEvent(signal.pastWorkstream!, task, now))
      : [],
  );

  const taskEvents = workstreams.flatMap((workstream) =>
    workstream.plan.tasks.map((task) => taskEvent(workstream, task, now)),
  );

  return [...externalEvents, ...referenceEvents, ...taskEvents].sort((a, b) => a.date.localeCompare(b.date));
}
