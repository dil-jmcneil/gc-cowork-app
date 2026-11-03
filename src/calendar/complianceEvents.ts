import type { Workstream, WorkstreamTask } from "@/workstreams/workstream";
import { taskAttention } from "@/workstreams/taskStatus";
import { insightType } from "@/insights/insight";
import { INSIGHTS } from "@/insights/insights";

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
  /** The insight or workstream this event belongs to. */
  source: string;
  /** Who owns it, when someone does. */
  owner?: string;
  /** Fallback link when the event isn't opened in an overlay. */
  href: string;
  /** What opening the event shows, for the hover tooltip. */
  linkLabel: string;
  /** Suggested next step, for the hover tooltip. */
  nextStep: string;
};

export type CalendarEvent =
  | (EventBase & { kind: "task"; workstreamId: string; taskId: string })
  | (EventBase & { kind: "external"; insightId: string });

function taskEvent(workstream: Workstream, task: WorkstreamTask, now: Date): CalendarEvent {
  const owner = task.delegate.label;
  const base = {
    kind: "task" as const,
    id: task.id,
    workstreamId: workstream.id,
    taskId: task.id,
    date: task.deadline,
    title: task.description,
    source: workstream.name,
    owner,
    href: `/workstreams/${workstream.id}/tasks/${task.id}`,
    linkLabel: `Task in ${workstream.name}`,
  };

  if (task.status === "Done") {
    return {
      ...base,
      status: "Complete",
      description: `${workstream.name} — ${owner} marked this done`,
      nextStep: "Nothing to do — ready to close",
    };
  }
  const attention = taskAttention(task, now);
  if (attention === "overdue") {
    return {
      ...base,
      status: "Blocked",
      attention: "nudge",
      description: `${workstream.name} — ${owner} hasn't responded; past due, nudge recommended`,
      nextStep: `Nudge ${owner}, or reassign the task`,
    };
  }
  if (attention === "new-status") {
    return {
      ...base,
      status: "Assigned",
      attention: "new-status",
      description: `${workstream.name} — ${owner} is working on it`,
      nextStep: `Review ${owner}'s update`,
    };
  }
  return {
    ...base,
    status: "Assigned",
    description: `${workstream.name} — assigned to ${owner}`,
    nextStep: `Wait for ${owner}, or check in before the deadline`,
  };
}

/**
 * Compliance calendar events: every insight deadline as an external
 * deadline, plus the tasks of every workstream. An insight has no tasks until
 * its workstream exists.
 */
export function deriveCalendarEvents(workstreams: Workstream[], now: Date): CalendarEvent[] {
  const workstreamChangeIds = new Set(workstreams.map((p) => p.sourceInsightId));

  const externalEvents: CalendarEvent[] = INSIGHTS.flatMap((insight) =>
    insight.deadlines.map((deadline, index) => {
      const hasWorkstream = workstreamChangeIds.has(insight.id);
      return {
        kind: "external" as const,
        id: `${insight.id}-deadline-${index}`,
        insightId: insight.id,
        date: deadline.date,
        title: deadline.label,
        description: `${insight.title} · ${insight.source}`,
        status: "External" as const,
        ...(hasWorkstream ? {} : { attention: "awaiting-response" as const }),
        source: insight.title,
        href: hasWorkstream ? "/" : `/workstreams/new?insight=${encodeURIComponent(insight.id)}`,
        linkLabel: `${insightType(insight)}: ${insight.title}`,
        nextStep: hasWorkstream ? "Track it through the workstream's tasks" : "Create a workstream to assign owners",
      };
    }),
  );

  const taskEvents = workstreams.flatMap((workstream) => workstream.plan.tasks.map((task) => taskEvent(workstream, task, now)));

  return [...externalEvents, ...taskEvents].sort((a, b) => a.date.localeCompare(b.date));
}
