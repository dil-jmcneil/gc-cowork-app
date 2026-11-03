import type { Milestone, PlanRule, TaskStatus } from "@/workstreams/workstream";

export type InsightStatus = "New" | "In review" | "In progress" | "Closed";

/** The kinds of insight Cowork can surface. Each insight carries exactly one as its "type" tag. */
export type InsightType = "Court ruling" | "Regulatory change" | "Enforcement action" | "Peer filing";

/** Metadata that says what an insight is and what it's about. */
export type InsightTag =
  { kind: "type"; label: InsightType } | { kind: "jurisdiction"; label: string } | { kind: "topic"; label: string };

export type InsightDeadline = {
  label: string;
  /** ISO date, yyyy-mm-dd. */
  date: string;
  /** One line on what the deadline means. */
  description?: string;
};

/** A task Cowork proposes when a workstream is drafted from the insight. */
export type TaskTemplate = {
  /** Stable within the insight, so stories can find the task again. */
  id: string;
  description: string;
  /** Email of the suggested owner, in the directory or a known outside contact. */
  ownerEmail: string;
  /** ISO date, yyyy-mm-dd. */
  due: string;
};

/** The plan Cowork proposes for an insight: milestones with their tasks, plus rules for every milestone. */
export type PlanTemplate = {
  approach: string;
  milestones: (Milestone & { tasks: TaskTemplate[] })[];
  rules: PlanRule[];
};

/**
 * A workstream from before this prototype's story begins. The prototype only
 * shows its name, progress and tasks (on the calendar); it has no pages.
 */
export type PastWorkstream = {
  name: string;
  status: "Active" | "Closed";
  /** ISO date, yyyy-mm-dd. */
  startedOn: string;
  tasks: PastWorkstreamTask[];
};

export type PastWorkstreamTask = {
  id: string;
  description: string;
  /** Owner's display name. */
  owner: string;
  /** ISO date, yyyy-mm-dd. */
  due: string;
  status: TaskStatus;
};

/** Something Cowork noticed that the GC may need to act on. Extends the OOUX regulatory change object. */
export type Insight = {
  id: string;
  title: string;
  summary: string;
  /** Who issued it, e.g. a court or a regulator. */
  source: string;
  /** The source document, e.g. the court's PDF of the opinion. */
  sourceUrl?: string;
  /** Formal citation, when the source has one. */
  citation?: string;
  /** Later events, e.g. an appeal. */
  history?: string;
  tags: InsightTag[];
  /** When the source issued it, ISO yyyy-mm-dd. */
  issuedDate: string;
  status: InsightStatus;
  /** External dates. Shown on the calendar as external deadlines. */
  deadlines: InsightDeadline[];
  /** What it means for the company. */
  reasonsRelevant: string[];
  /** The plan Cowork proposes. Past insights that were handled another way have none. */
  plan?: PlanTemplate;
  /** A workstream started before the prototype's story, shown read-only. */
  pastWorkstream?: PastWorkstream;
  /** How an insight was handled without a workstream, e.g. "Reviewed Aug 20. No change needed." */
  outcome?: string;
};

export type PlannedInsight = Insight & { plan: PlanTemplate };

export function hasPlan(insight: Insight): insight is PlannedInsight {
  return insight.plan !== undefined;
}

/** Done tasks over all tasks, e.g. "3 of 4 tasks done". */
export function pastWorkstreamProgress(workstream: PastWorkstream): string {
  const done = workstream.tasks.filter((t) => t.status === "Done").length;
  return `${done} of ${workstream.tasks.length} tasks done`;
}

export function insightType(insight: Pick<Insight, "tags">): InsightType {
  const tag = insight.tags.find((t) => t.kind === "type");
  if (!tag) throw new Error("An insight needs a type tag");
  return tag.label as InsightType;
}

/** How each type names its issued date, e.g. a ruling is "Decided". */
export const ISSUED_LABEL: Record<InsightType, string> = {
  "Court ruling": "Decided",
  "Regulatory change": "Effective",
  "Enforcement action": "Announced",
  "Peer filing": "Filed",
};

/** Link text for each type's source document. */
export const SOURCE_LINK_LABEL: Record<InsightType, string> = {
  "Court ruling": "Read the opinion (PDF)",
  "Regulatory change": "Read the rule",
  "Enforcement action": "Read the announcement",
  "Peer filing": "Read the filing",
};

/** What each type calls its "why it's relevant" list. */
export const RELEVANCE_LABEL: Record<InsightType, string> = {
  "Court ruling": "Points for Counsel",
  "Regulatory change": "Reasons Relevant",
  "Enforcement action": "Reasons Relevant",
  "Peer filing": "Reasons Relevant",
};
