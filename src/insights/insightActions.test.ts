import { workstreamActionForInsight } from "@/insights/insightActions";
import { ATG_RULING, PAST_INSIGHTS } from "@/insights/insights";
import type { Workstream } from "@/workstreams/workstream";

const WORKSTREAM = { id: "workstream-1", name: "Cyber readiness" } as Workstream;

test("offers to create a workstream when none exists", () => {
  expect(workstreamActionForInsight(ATG_RULING, undefined)).toEqual({
    kind: "create",
    href: "/workstreams/new?insight=atg-v-lane",
  });
});

test("links to the existing workstream when one exists", () => {
  expect(workstreamActionForInsight(ATG_RULING, WORKSTREAM)).toEqual({
    kind: "view",
    href: "/workstreams/workstream-1",
    workstreamName: "Cyber readiness",
  });
});

test("offers nothing for past insights: they were handled before, with or without a workstream", () => {
  for (const insight of PAST_INSIGHTS) expect(workstreamActionForInsight(insight, undefined)).toEqual({ kind: "none" });
});
