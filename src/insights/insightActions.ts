import type { Workstream } from "@/workstreams/workstream";

import { hasPlan, type Insight } from "./insight";

export type WorkstreamAction =
  | { kind: "create"; href: string }
  | { kind: "view"; href: string; workstreamName: string }
  /** Nothing to do here: the insight was handled before, or has no plan to start. */
  | { kind: "none" };

/** Whether an insight's card/dialog should offer to create a workstream, open its existing one, or neither. */
export function workstreamActionForInsight(insight: Insight, workstream: Workstream | undefined): WorkstreamAction {
  if (workstream) return { kind: "view", href: `/workstreams/${workstream.id}`, workstreamName: workstream.name };
  if (insight.pastWorkstream || insight.outcome || !hasPlan(insight)) return { kind: "none" };
  return { kind: "create", href: `/workstreams/new?insight=${encodeURIComponent(insight.id)}` };
}
