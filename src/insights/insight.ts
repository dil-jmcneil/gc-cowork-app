import type { Milestone, PlanRule } from "@/projects/project";

export type InsightStatus = "New" | "In review" | "Closed";

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

/** A task Cowork proposes when a project is drafted from the insight. */
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

/** Something Cowork noticed that the GC may need to act on. Extends the OOUX regulatory change object. */
export type Insight = {
  id: string;
  title: string;
  summary: string;
  /** Who issued it, e.g. a court or a regulator. */
  source: string;
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
  plan: PlanTemplate;
};

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

/** What each type calls its "why it's relevant" list. */
export const RELEVANCE_LABEL: Record<InsightType, string> = {
  "Court ruling": "Points for Counsel",
  "Regulatory change": "Reasons Relevant",
  "Enforcement action": "Reasons Relevant",
  "Peer filing": "Reasons Relevant",
};
