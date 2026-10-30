import type { TaskOwner } from "./people";

/** Project, Plan and Task follow the GC Cowork OOUX object model. */
export type TaskStatus = "Not started" | "In progress" | "Done";

export type ProjectTask = {
  id: string;
  description: string;
  delegator: string;
  /** Owner of the task. */
  delegate: TaskOwner;
  /** People kept informed or accountable. */
  ccs: TaskOwner[];
  /** ISO date, yyyy-mm-dd. */
  deadline: string;
  status: TaskStatus;
};

export type PlanStatus = "draft" | "accepted";

export type ProjectPlan = {
  proposedApproach: string;
  status: PlanStatus;
  tasks: ProjectTask[];
};

export type ProjectDraft = {
  name: string;
  sourceChangeId: string;
  description: string;
  reasonsRelevant: string[];
  plan: ProjectPlan;
};

export type Project = ProjectDraft & {
  id: string;
  /** One or two sentences on where the project stands, from plan and task progress. */
  statusSummary: string;
  createdAt: string;
};
