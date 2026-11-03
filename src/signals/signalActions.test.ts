import { workstreamActionForSignal } from "@/signals/signalActions";
import { ATG_RULING, PAST_SIGNALS } from "@/signals/signals";
import type { Workstream } from "@/workstreams/workstream";

const WORKSTREAM = { id: "workstream-1", name: "Cyber readiness" } as Workstream;

test("offers to create a workstream when none exists", () => {
  expect(workstreamActionForSignal(ATG_RULING, undefined)).toEqual({
    kind: "create",
    href: "/workstreams/new?signal=atg-v-lane",
  });
});

test("links to the existing workstream when one exists", () => {
  expect(workstreamActionForSignal(ATG_RULING, WORKSTREAM)).toEqual({
    kind: "view",
    href: "/workstreams/workstream-1",
    workstreamName: "Cyber readiness",
  });
});

test("offers nothing for past signals: they were handled before, with or without a workstream", () => {
  for (const signal of PAST_SIGNALS) expect(workstreamActionForSignal(signal, undefined)).toEqual({ kind: "none" });
});
