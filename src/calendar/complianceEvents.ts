import type { Project, ProjectTask } from "@/projects/project";
import { taskAttention } from "@/projects/taskStatus";
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
  /** The insight or project this event belongs to. */
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
  | (EventBase & { kind: "task"; projectId: string; taskId: string })
  | (EventBase & { kind: "external"; insightId: string });

function taskEvent(project: Project, task: ProjectTask, now: Date): CalendarEvent {
  const owner = task.delegate.label;
  const base = {
    kind: "task" as const,
    id: task.id,
    projectId: project.id,
    taskId: task.id,
    date: task.deadline,
    title: task.description,
    source: project.name,
    owner,
    href: `/projects/${project.id}/tasks/${task.id}`,
    linkLabel: `Task in ${project.name}`,
  };

  if (task.status === "Done") {
    return {
      ...base,
      status: "Complete",
      description: `${project.name} — ${owner} marked this done`,
      nextStep: "Nothing to do — ready to close",
    };
  }
  const attention = taskAttention(task, now);
  if (attention === "overdue") {
    return {
      ...base,
      status: "Blocked",
      attention: "nudge",
      description: `${project.name} — ${owner} hasn't responded; past due, nudge recommended`,
      nextStep: `Nudge ${owner}, or reassign the task`,
    };
  }
  if (attention === "new-status") {
    return {
      ...base,
      status: "Assigned",
      attention: "new-status",
      description: `${project.name} — ${owner} is working on it`,
      nextStep: `Review ${owner}'s update`,
    };
  }
  return {
    ...base,
    status: "Assigned",
    description: `${project.name} — assigned to ${owner}`,
    nextStep: `Wait for ${owner}, or check in before the deadline`,
  };
}

/**
 * Compliance calendar events: every insight deadline as an external
 * deadline, plus the tasks of every project. A insight has no tasks until
 * its project exists.
 */
export function deriveCalendarEvents(projects: Project[], now: Date): CalendarEvent[] {
  const projectChangeIds = new Set(projects.map((p) => p.sourceInsightId));

  const externalEvents: CalendarEvent[] = INSIGHTS.flatMap((insight) =>
    insight.deadlines.map((deadline, index) => {
      const hasProject = projectChangeIds.has(insight.id);
      return {
        kind: "external" as const,
        id: `${insight.id}-deadline-${index}`,
        insightId: insight.id,
        date: deadline.date,
        title: deadline.label,
        description: `${insight.title} · ${insight.source}`,
        status: "External" as const,
        ...(hasProject ? {} : { attention: "awaiting-response" as const }),
        source: insight.title,
        href: hasProject ? "/" : `/projects/new?insight=${encodeURIComponent(insight.id)}`,
        linkLabel: `${insightType(insight)}: ${insight.title}`,
        nextStep: hasProject ? "Track it through the project's tasks" : "Create a project to assign owners",
      };
    }),
  );

  const taskEvents = projects.flatMap((project) => project.plan.tasks.map((task) => taskEvent(project, task, now)));

  return [...externalEvents, ...taskEvents].sort((a, b) => a.date.localeCompare(b.date));
}
