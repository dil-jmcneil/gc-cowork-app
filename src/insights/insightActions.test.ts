import { workstreamActionForInsight } from "@/insights/insightActions";
import type { Workstream } from "@/workstreams/workstream";

const WORKSTREAM = { id: "workstream-1", name: "Cyber readiness" } as Workstream;

test("offers to create a workstream when none exists", () => {
  const action = workstreamActionForInsight("atg-v-lane", undefined);
  expect(action).toEqual({
    kind: "create",
    href: "/workstreams/new?insight=atg-v-lane",
  });
});

test("links to the existing workstream when one exists", () => {
  const action = workstreamActionForInsight("atg-v-lane", WORKSTREAM);
  expect(action).toEqual({
    kind: "view",
    href: "/workstreams/workstream-1",
    workstreamName: "Cyber readiness",
  });
});
