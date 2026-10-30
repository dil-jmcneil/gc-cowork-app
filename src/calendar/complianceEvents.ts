import type { Project } from "@/projects/project";
import { REGULATORY_CHANGES } from "@/regulatory/regulatoryChanges";

export type CalendarEventStatus = "Assigned" | "Complete" | "Blocked";

export type CalendarEvent = {
  id: string;
  /** ISO date, yyyy-mm-dd. */
  date: string;
  title: string;
  description: string;
  status: CalendarEventStatus;
  href: string;
};

function isOverdue(date: string, now: Date): boolean {
  return new Date(`${date}T00:00:00Z`) < now;
}

/**
 * Compliance calendar events: a regulatory deadline for every change that
 * doesn't have a project yet, and a task for every change that does — so a
 * tracked deadline shows once, as the task carrying it.
 */
export function deriveCalendarEvents(projects: Project[], now: Date): CalendarEvent[] {
  const projectByChangeId = new Map(projects.map((p) => [p.sourceChangeId, p]));

  const deadlineEvents = REGULATORY_CHANGES.filter((change) => !projectByChangeId.has(change.id)).flatMap(
    (change) =>
      change.deadlines.map((deadline, index) => ({
        id: `${change.id}-${index}`,
        date: deadline.date,
        title: deadline.label,
        description: `${change.title} · ${change.regulatoryBody}`,
        status: (isOverdue(deadline.date, now) ? "Blocked" : "Assigned") as CalendarEventStatus,
        href: `/projects/new?change=${encodeURIComponent(change.id)}`,
      })),
  );

  const taskEvents = projects.flatMap((project) =>
    project.plan.tasks.map((task) => ({
      id: task.id,
      date: task.deadline,
      title: task.description,
      description: `${project.name} · ${task.delegate.label}`,
      status: (task.status === "Done"
        ? "Complete"
        : isOverdue(task.deadline, now)
          ? "Blocked"
          : "Assigned") as CalendarEventStatus,
      href: `/projects/${project.id}`,
    })),
  );

  return [...deadlineEvents, ...taskEvents].sort((a, b) => a.date.localeCompare(b.date));
}
