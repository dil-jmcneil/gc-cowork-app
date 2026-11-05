import { ATG_RULING } from "@/signals/signals";

import { PAST_WORKSTREAMS } from "./pastWorkstreams";
import { summarySentences } from "./summary";
import { workstreamAttention } from "./workstreamAttention";
import { draftWorkstreamFromSignal } from "./workstreamDraft";
import { SEED_WORKSTREAMS, useWorkstreamStore } from "./workstreamStore";

const NOW = new Date("2026-11-03T12:00:00Z");

beforeEach(() => useWorkstreamStore.setState({ workstreams: [...SEED_WORKSTREAMS] }));

function startAtgWorkstream() {
  const draft = draftWorkstreamFromSignal(ATG_RULING);
  return useWorkstreamStore.getState().createWorkstream({ ...draft, plan: { ...draft.plan, status: "accepted" } });
}

test("the headline is your next action: review Dana's memo", () => {
  const { summary, waitingOnYou } = workstreamAttention(startAtgWorkstream(), NOW);
  expect(summary.headline).toMatch(/^Review Dana's memo/);
  expect(waitingOnYou.map((i) => i.task.id)).toEqual(["atg-v-lane-counsel"]);
  expect(waitingOnYou[0].action).toBe("confirm");
});

test("the support says what happened and who's held up, in two sentences at most", () => {
  const { summary } = workstreamAttention(startAtgWorkstream(), NOW);
  expect(summary.support.length).toBeLessThanOrEqual(2);
  expect(summary.support.join(" ")).toMatch(/Nov 2/);
  expect(summary.support.join(" ")).toMatch(/Alex Kim/);
});

test("nobody else in the ATG story needs a nudge", () => {
  expect(workstreamAttention(startAtgWorkstream(), NOW).waitingOnOthers).toHaveLength(0);
});

test("an owner who hasn't answered a follow-up is waiting on a nudge", () => {
  const workstream = startAtgWorkstream();
  useWorkstreamStore.getState().nudgeTask(workstream.id, "atg-v-lane-adopt");
  const { waitingOnOthers } = workstreamAttention(useWorkstreamStore.getState().getWorkstream(workstream.id)!, NOW);
  expect(waitingOnOthers.map((i) => i.task.delegate.label)).toEqual(["Pete Lin"]);
  expect(waitingOnOthers[0].action).toBe("nudge");
});

test("once you confirm counsel's view, the headline turns to progress", () => {
  const workstream = startAtgWorkstream();
  useWorkstreamStore.getState().confirmTaskDone(workstream.id, "atg-v-lane-counsel");
  const after = workstreamAttention(useWorkstreamStore.getState().getWorkstream(workstream.id)!, NOW);
  expect(after.waitingOnYou).toHaveLength(0);
  expect(after.summary.headline).toBe("On track: 1 of 4 tasks done.");
  expect(after.summary.support[0]).toMatch(/^Next up: prepare the change \(Alex Kim, due Nov 13\)/);
});

test("an overdue task is the headline when nothing waits on you", () => {
  const climate = PAST_WORKSTREAMS.find((w) => w.name === "Climate disclosure readiness")!;
  const { summary, waitingOnOthers } = workstreamAttention(climate, NOW);
  expect(summary.headline).toMatch(/^Nudge Maya Chen/);
  expect(summary.headline).toMatch(/was due Nov 2/);
  expect(waitingOnOthers[0].task.id).toBe("climate-assurance");
});

test("with nothing waiting, the headline is progress", () => {
  const cyber = PAST_WORKSTREAMS.find((w) => w.name === "Cyber 8-K readiness")!;
  const { summary } = workstreamAttention(cyber, NOW);
  expect(summary.headline).toMatch(/On track/);
  expect(summary.headline).toMatch(/3 of 4 tasks done/);
});

test("every workstream summary follows the rules: one headline, two support sentences at most", () => {
  const all = [startAtgWorkstream(), ...PAST_WORKSTREAMS];
  for (const workstream of all) {
    const { summary } = workstreamAttention(workstream, NOW);
    expect(summarySentences(summary.headline)).toBe(1);
    expect(summary.support.reduce((n, s) => n + summarySentences(s), 0)).toBeLessThanOrEqual(2);
  }
});
