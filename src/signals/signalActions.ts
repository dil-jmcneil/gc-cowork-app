import type { Workstream } from "@/workstreams/workstream";

import { hasPlan, type Signal } from "./signal";

export type WorkstreamAction =
  | { kind: "create"; href: string }
  | { kind: "view"; href: string; workstreamName: string }
  /** Nothing to do here: the signal was handled before, or has no plan to start. */
  | { kind: "none" };

/** Whether a signal's card/dialog should offer to create a workstream, open its existing one, or neither. */
export function workstreamActionForSignal(signal: Signal, workstream: Workstream | undefined): WorkstreamAction {
  if (workstream) return { kind: "view", href: `/workstreams/${workstream.id}`, workstreamName: workstream.name };
  if (signal.pastWorkstream || signal.outcome || !hasPlan(signal)) return { kind: "none" };
  return { kind: "create", href: `/workstreams/new?signal=${encodeURIComponent(signal.id)}` };
}
