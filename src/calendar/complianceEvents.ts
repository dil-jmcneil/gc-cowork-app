import type { Project, ProjectTask } from "@/projects/project";
import { REGULATORY_CHANGES } from "@/regulatory/regulatoryChanges";

export type CalendarEventStatus = "Assigned" | "Complete" | "Blocked";

/** What the timeline's right-hand Attention slot shows for an event. */
export type CalendarEventAttention = "nudge" | "awaiting-response" | "new-status";

export type CalendarEvent = {
  id: string;
  /** ISO date, yyyy-mm-dd. */
  date: string;
  title: string;
  /** One-line status sentence, e.g. "Jordan Lee hasn't responded — past due; nudge recommended". */
  description: string;
  status: CalendarEventStatus;
  attention?: CalendarEventAttention;
  /** The regulatory change or project this event belongs to. */
  source: string;
  /** Who owns it, when someone does. */
  owner?: string;
  href: string;
  /** What clicking the event opens, for the hover tooltip. */
  linkLabel: string;
  /** Suggested next step, for the hover tooltip. */
  nextStep: string;
};

function isOverdue(date: string, now: Date): boolean {
  return new Date(`${date}T00:00:00Z`) < now;
}

function taskEvent(project: Project, task: ProjectTask, now: Date): CalendarEvent {
  const owner = task.delegate.label;
  const base = {
    id: task.id,
    date: task.deadline,
    title: task.description,
    source: project.name,
    owner,
    href: `/projects/${project.id}`,
    linkLabel: `Project: ${project.name}`,
  };

  if (task.status === "Done") {
    return {
      ...base,
      status: "Complete",
      description: `${project.name} — ${owner} marked this done`,
      nextStep: "Nothing to do — ready to close",
    };
  }
  if (isOverdue(task.deadline, now)) {
    return {
      ...base,
      status: "Blocked",
      attention: "nudge",
      description: `${project.name} — ${owner} hasn't responded; past due, nudge recommended`,
      nextStep: `Nudge ${owner}, or reassign the task`,
    };
  }
  if (task.status === "In progress") {
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
 * Compliance calendar events: a regulatory deadline for every change that
 * doesn't have a project yet, and a task for every change that does — so a
 * tracked deadline shows once, as the task carrying it.
 */
export function deriveCalendarEvents(projects: Project[], now: Date): CalendarEvent[] {
  const projectByChangeId = new Map(projects.map((p) => [p.sourceChangeId, p]));

  const deadlineEvents: CalendarEvent[] = REGULATORY_CHANGES.filter(
    (change) => !projectByChangeId.has(change.id),
  ).flatMap((change) =>
    change.deadlines.map((deadline, index) => ({
      id: `${change.id}-${index}`,
      date: deadline.date,
      title: deadline.label,
      description: `${change.title} · ${change.regulatoryBody} — no project yet`,
      status: isOverdue(deadline.date, now) ? "Blocked" : "Assigned",
      attention: "awaiting-response",
      source: change.title,
      href: `/projects/new?change=${encodeURIComponent(change.id)}`,
      linkLabel: `Regulatory change: ${change.title}`,
      nextStep: "Create a project to assign an owner",
    })),
  );

  const taskEvents = projects.flatMap((project) =>
    project.plan.tasks.map((task) => taskEvent(project, task, now)),
  );

  return [...deadlineEvents, ...taskEvents].sort((a, b) => a.date.localeCompare(b.date));
}
