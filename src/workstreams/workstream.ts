import type { TaskOwner } from "./people";
import type { HistoryEntry } from "./thread";

/** Workstream, Plan and Task follow the GC Cowork OOUX object model. */
export type TaskStatus = "Not started" | "In progress" | "Done";

export type WorkstreamTask = {
  id: string;
  /** The milestone this task belongs to. */
  milestoneId: string;
  description: string;
  delegator: string;
  /** Owner of the task. */
  delegate: TaskOwner;
  /** People kept informed or accountable. */
  ccs: TaskOwner[];
  /** ISO date, yyyy-mm-dd. */
  deadline: string;
  status: TaskStatus;
  history: HistoryEntry[];
  /** Hand-written summary for a scripted story; otherwise one is generated. */
  statusSummary?: string;
};

/**
 * One row of a plan's rule table, after Hoare's {P} C {Q}: when the work is in
 * this state, Cowork takes these actions until the work reaches that state.
 * Rows never name each other; which row applies next depends only on what the
 * work looks like after the last one ran.
 */
export type PlanRule = {
  id: string;
  /** Precondition: a state the work can be in. */
  when: string;
  /** What Cowork does about it. */
  actions: string;
  /** Where Cowork stops trying and hands the decision to a person. */
  circuitBreaker?: string;
  /** Postcondition: the "good enough" state where this row's work is done. */
  until: string;
  /** "progress" rows describe the work going well; "exception" rows remediate. */
  kind: "progress" | "exception";
};

/**
 * A big step in the plan: judged only by its contract, what must be true to
 * start and what must exist to hand over, with a person approving the move on.
 * What happens inside is governed by the milestone's rules, not a fixed route.
 */
export type Milestone = {
  id: string;
  title: string;
  /** Input context: what must be true to begin. */
  startsWhen: string;
  /** Output context: what must exist before the next milestone starts. */
  doneWhen: string;
  /** Who approves the handover to the next milestone. */
  approver: string;
  rules: PlanRule[];
};

export type PlanStatus = "draft" | "accepted";

export type WorkstreamPlan = {
  proposedApproach: string;
  status: PlanStatus;
  /** The plan's spine, in order. */
  milestones: Milestone[];
  /** Rules that apply in every milestone. */
  rules: PlanRule[];
  tasks: WorkstreamTask[];
};

export type WorkstreamDraft = {
  name: string;
  sourceInsightId: string;
  description: string;
  reasonsRelevant: string[];
  plan: WorkstreamPlan;
};

export type Workstream = WorkstreamDraft & {
  id: string;
  /** One or two sentences on where the workstream stands, from plan and task progress. */
  statusSummary: string;
  createdAt: string;
};
