import { ATG_RULING } from "@/signals/signals";

import { asksToStart, startWorkstream } from "./startWorkstream";
import { workstreamChatId } from "./workstreamChat";
import { draftChatId } from "./draftChat";
import { draftWorkstreamFromSignal } from "./workstreamDraft";
import { SEED_WORKSTREAMS, useWorkstreamStore } from "./workstreamStore";

beforeEach(() => useWorkstreamStore.setState({ workstreams: [...SEED_WORKSTREAMS] }));

test("starting creates the workstream, and Cowork says it's emailing each owner, task by task", () => {
  const { workstream, reply } = startWorkstream(draftWorkstreamFromSignal(ATG_RULING));
  expect(workstream.plan.status).toBe("accepted");
  expect(useWorkstreamStore.getState().getWorkstream(workstream.id)).toBeDefined();
  expect(reply).toMatch(/^Started\. I'm emailing each owner their task now\./);
  expect(reply).toContain("1. Get counsel's view: Dana Whitfield, due Nov 6");
  expect(reply).toContain("4. Watch the nomination window: Pete Lin, due Feb 6");
  expect(reply).toMatch(/follow up/);
  // The teaching moment: this chat is how you work the page.
  expect(reply).toMatch(/here/);
});

test("every owner gets an email when the workstream starts", () => {
  const { workstream } = startWorkstream(draftWorkstreamFromSignal(ATG_RULING));
  for (const task of workstream.plan.tasks) {
    const emails = task.history.filter(
      (e) => e.kind === "message" && e.channel === "email" && e.authorRole === "cowork",
    );
    expect(emails.length, task.description).toBeGreaterThan(0);
  }
});

test("chat understands asking to start", () => {
  for (const text of ["Start", "start it", "Accept and start", "Looks good, go ahead", "accept the plan"]) {
    expect(asksToStart(text), text).toBe(true);
  }
  for (const text of ["When does it start?", "Remove task 4", "Who owns the 8-K?"]) {
    expect(asksToStart(text), text).toBe(false);
  }
});

test("the draft and the started workstream share one chat thread", () => {
  const { workstream } = startWorkstream(draftWorkstreamFromSignal(ATG_RULING));
  expect(workstreamChatId(workstream)).toBe(draftChatId(ATG_RULING.id));
});
