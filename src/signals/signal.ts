import type { PlanRule, TaskStatus } from "@/workstreams/workstream";

export type SignalStatus = "New" | "In review" | "In progress" | "Closed";

/** The kinds of signal Cowork can surface. Each signal carries exactly one as its "type" tag. */
export type SignalType = "Court ruling" | "Regulatory change" | "Enforcement action" | "Peer filing";

/** Metadata that says what a signal is and what it's about. */
export type SignalTag =
  { kind: "type"; label: SignalType } | { kind: "jurisdiction"; label: string } | { kind: "topic"; label: string };

export type SignalDeadline = {
  label: string;
  /** ISO date, yyyy-mm-dd. */
  date: string;
  /** One line on what the deadline means. */
  description?: string;
};

/** A task Cowork proposes when a workstream is drafted from the signal. */
export type TaskTemplate = {
  /** Stable within the signal, so stories can find the task again. */
  id: string;
  description: string;
  /** What done looks like: the end state and who confirms it, not the steps. */
  doneWhen: string;
  /** Email of the suggested owner, in the directory or a known outside contact. */
  ownerEmail: string;
  /** People kept informed, by email. */
  ccEmails: string[];
  /** ISO date, yyyy-mm-dd. */
  due: string;
  /** The template id of a task that has to finish first. */
  waitingOn?: string;
  /** The words in the plan's approach that describe this task, removed with it. */
  approachPhrase?: string;
};

/** The plan Cowork proposes for a signal: big-picture tasks plus the rules Cowork follows to work them. */
export type PlanTemplate = {
  /** The Create workstream summary: what the signal is, why it matters to Acme, and what Cowork suggests. */
  brief: { headline: string; support: string[] };
  approach: string;
  tasks: TaskTemplate[];
  rules: PlanRule[];
};

/**
 * A workstream from before this prototype's story begins. It loads as a real
 * workstream (`src/workstreams/pastWorkstreams.ts`), with a page and its tasks
 * on the calendar.
 */
export type PastWorkstream = {
  name: string;
  status: "Active" | "Closed";
  /** ISO date, yyyy-mm-dd. */
  startedOn: string;
  /** One or two sentences on where it stands, with the task count, as Cowork would write it. */
  statusSummary: string;
  tasks: PastWorkstreamTask[];
};

export type PastWorkstreamTask = {
  id: string;
  description: string;
  doneWhen: string;
  waitingOn?: string;
  /** Owner's display name. */
  owner: string;
  /** ISO date, yyyy-mm-dd. */
  due: string;
  status: TaskStatus;
  /** One line on the latest status and activity, as Cowork would write it. */
  statusSummary: string;
};

/** Something Cowork noticed that the GC may need to act on. Extends the OOUX regulatory change object. */
export type Signal = {
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
  tags: SignalTag[];
  /** When the source issued it, ISO yyyy-mm-dd. */
  issuedDate: string;
  status: SignalStatus;
  /** External dates. Shown on the calendar as external deadlines. */
  deadlines: SignalDeadline[];
  /** What it means for the company. */
  reasonsRelevant: string[];
  /** The plan Cowork proposes. Past signals that were handled another way have none. */
  plan?: PlanTemplate;
  /** A workstream started before the prototype's story, shown read-only. */
  pastWorkstream?: PastWorkstream;
  /** How a signal was handled without a workstream, e.g. "Reviewed Aug 20. No change needed." */
  outcome?: string;
};

export type PlannedSignal = Signal & { plan: PlanTemplate };

export function hasPlan(signal: Signal): signal is PlannedSignal {
  return signal.plan !== undefined;
}

/** Done tasks over all tasks, e.g. "3 of 4 tasks done". */
export function pastWorkstreamProgress(workstream: PastWorkstream): string {
  const done = workstream.tasks.filter((t) => t.status === "Done").length;
  return `${done} of ${workstream.tasks.length} tasks done`;
}

export function signalType(signal: Pick<Signal, "tags">): SignalType {
  const tag = signal.tags.find((t) => t.kind === "type");
  if (!tag) throw new Error("A signal needs a type tag");
  return tag.label as SignalType;
}

/** How each type names its issued date, e.g. a ruling is "Decided". */
export const ISSUED_LABEL: Record<SignalType, string> = {
  "Court ruling": "Decided",
  "Regulatory change": "Effective",
  "Enforcement action": "Announced",
  "Peer filing": "Filed",
};

/** Link text for each type's source document. */
export const SOURCE_LINK_LABEL: Record<SignalType, string> = {
  "Court ruling": "Read the opinion (PDF)",
  "Regulatory change": "Read the rule",
  "Enforcement action": "Read the announcement",
  "Peer filing": "Read the filing",
};

/**
 * One label for a signal's "why it matters to Acme" list, whatever its type.
 * Court rulings used to say "Points for Counsel" and others "Reasons Relevant";
 * both described the same thing.
 */
export const RELEVANCE_LABEL = "Relevance";

/** Relevance never shows more than two reasons, wherever it appears. */
export const RELEVANCE_SHOWN = 2;

export function shownRelevance(reasons: string[]): string[] {
  return reasons.slice(0, RELEVANCE_SHOWN);
}
