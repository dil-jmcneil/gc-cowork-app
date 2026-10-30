import type { RegulatoryChange } from "@/regulatory/regulatoryChange";
import { LOGGED_IN_USER } from "@/user";

import { findPerson, ownerShortName } from "./people";
import type { Project, ProjectDraft, ProjectTask } from "./project";

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

function formatShortDate(iso: string): string {
  return dateFormat.format(new Date(`${iso}T00:00:00Z`));
}

const COMPLIANCE_LEAD = "sam.ortiz@acme.com";
const PRIVACY_COUNSEL = "jordan.lee@acme.com";

/** The compliance lead stays informed on every task, unless they own it. */
function defaultCcs(ownerEmail: string) {
  return [findPerson(ownerEmail === COMPLIANCE_LEAD ? PRIVACY_COUNSEL : COMPLIANCE_LEAD)];
}

/** Mocked "AI" draft: name, description, and a plan built from the change's task templates. */
export function draftProjectFromChange(change: RegulatoryChange): ProjectDraft {
  const firstDeadline = [...change.deadlines].sort((a, b) => a.date.localeCompare(b.date))[0];

  const tasks: ProjectTask[] = change.taskTemplates.map((template) => ({
    id: `${change.id}-${template.id}`,
    description: template.description,
    delegator: LOGGED_IN_USER.firstName,
    delegate: findPerson(template.ownerEmail),
    ccs: defaultCcs(template.ownerEmail),
    deadline: template.due,
    status: "Not started",
    thread: [],
  }));

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
  return `${progress}. Next up: ${next.description.charAt(0).toLowerCase()}${next.description.slice(1)} (${ownerShortName(next.delegate)}, due ${formatShortDate(next.deadline)}).${planNote}`;
}
