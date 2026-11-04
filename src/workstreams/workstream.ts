import type { TaskOwner } from "./people";
import type { HistoryEntry } from "./thread";

/** Workstream, Plan and Task follow the GC Cowork OOUX object model. */
export type TaskStatus = "Not started" | "In progress" | "Done";

/**
 * A big-picture task in the plan, judged only by its contract: who owns it and
 * what done looks like. How it gets done isn't prescribed; Cowork and the
 * people involved work through that, governed by the plan's rules.
 */
export type WorkstreamTask = {
  id: string;
  description: string;
  /** The postcondition: the end state that closes the task, and who confirms it. */
  doneWhen: string;
  /** Another task that has to finish before this one can move; it's Blocked until then. */
  waitingOn?: string;
  /** The words in the plan's approach that describe this task, removed with it. */
  approachPhrase?: string;
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
  /**
   * The owner says it's done, but the GC confirms before it closes, e.g. when
   * the owner is outside the company. The task stays open until then.
   */
  awaitingReview?: boolean;
  /** While awaiting review: the GC's next step, as the status summary's headline. */
  reviewPrompt?: string;
  /** While awaiting review: the name of the file to review, linked from the task's status line. */
  reviewFile?: string;
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

export type PlanStatus = "draft" | "accepted";

export type WorkstreamPlan = {
  proposedApproach: string;
  status: PlanStatus;
  /** How Cowork works the tasks: precondition, actions, postcondition rows. */
  rules: PlanRule[];
  tasks: WorkstreamTask[];
};

export type WorkstreamDraft = {
  name: string;
  sourceSignalId: string;
  description: string;
  reasonsRelevant: string[];
  plan: WorkstreamPlan;
};

export type Workstream = WorkstreamDraft & {
  id: string;
  createdAt: string;
};
