import type { RegulatoryChange } from "@/regulatory/regulatoryChange";
import { LOGGED_IN_USER } from "@/user";

import type { Project, ProjectDraft, ProjectTask } from "./project";

export const TASK_OWNERS = ["Maya Chen, CISO", "Jordan Lee, privacy counsel", "Sam Ortiz, compliance lead"];

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

function formatShortDate(iso: string): string {
  return dateFormat.format(new Date(`${iso}T00:00:00Z`));
}

/** The ISO date `days` before another ISO date. */
function daysBefore(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

/** Mocked "AI" draft: name, description, and a plan with tasks from the rule's deadlines. */
export function draftProjectFromChange(change: RegulatoryChange): ProjectDraft {
  const firstDeadline = [...change.deadlines].sort((a, b) => a.date.localeCompare(b.date))[0];
  const owner = (i: number) => TASK_OWNERS[i % TASK_OWNERS.length];

  const tasks: ProjectTask[] = [
    {
      id: `${change.id}-gap`,
      description: `Compare the rule against our policies and list the gaps`,
      delegator: LOGGED_IN_USER.firstName,
      delegate: owner(0),
      ccs: [owner(2)],
      deadline: daysBefore(firstDeadline.date, 3),
      status: "Not started",
    },
    ...change.deadlines.map((deadline, i) => ({
      id: `${change.id}-deadline-${i}`,
      description: deadline.label,
      delegator: LOGGED_IN_USER.firstName,
      delegate: owner(i + 1),
      ccs: [owner(0)],
      deadline: deadline.date,
      status: "Not started" as const,
    })),
  ];

  return {
    name: change.title,
    sourceChangeId: change.id,
    description: change.summary,
    reasonsRelevant: [...change.reasonsRelevant],
    plan: {
      proposedApproach: `Find where our current policies fall short of the new ${change.regulatoryBody} requirements, assign an owner for each gap, and close them before ${formatShortDate(firstDeadline.date)}.`,
      status: "draft",
      tasks,
    },
  };
}

/** Mocked "AI" status summary from task progress and the next deadline. */
export function summarizeProject(project: Pick<Project, "plan">): string {
  const { tasks, status } = project.plan;
  const done = tasks.filter((t) => t.status === "Done").length;
  const next = tasks
    .filter((t) => t.status !== "Done")
    .sort((a, b) => a.deadline.localeCompare(b.deadline))[0];
  const progress = `${done} of ${tasks.length} tasks done`;
  if (!next) return `${progress}. Everything on the plan is complete.`;
  const planNote = status === "draft" ? " The plan is still a draft." : "";
  return `${progress}. Next up: ${next.description.charAt(0).toLowerCase()}${next.description.slice(1)} (${next.delegate.split(",")[0]}, due ${formatShortDate(next.deadline)}).${planNote}`;
}
