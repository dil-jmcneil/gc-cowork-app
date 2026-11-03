import type { Workstream } from "@/workstreams/workstream";

export type WorkstreamAction = { kind: "create"; href: string } | { kind: "view"; href: string; workstreamName: string };

/** Whether an insight's card/dialog should offer to create a workstream or open its existing one. */
export function workstreamActionForInsight(insightId: string, workstream: Workstream | undefined): WorkstreamAction {
  if (workstream)
    return {
      kind: "view",
      href: `/workstreams/${workstream.id}`,
      workstreamName: workstream.name,
    };
  return {
    kind: "create",
    href: `/workstreams/new?insight=${encodeURIComponent(insightId)}`,
  };
}
