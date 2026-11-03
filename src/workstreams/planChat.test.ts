import { ATG_RULING } from "@/signals/signals";

import { planEditFromChat } from "./planChat";
import { draftWorkstreamFromSignal } from "./workstreamDraft";

const plan = draftWorkstreamFromSignal(ATG_RULING).plan;
const PROMPT = "Remove Milestone 4 and add the closing action to Milestone 3.";

test("removing Milestone 4 takes its tasks, and Milestone 3 takes over the closing step", () => {
  const edit = planEditFromChat(plan, PROMPT)!;
  expect(edit.plan.milestones.map((m) => m.id)).toEqual(["assess", "prepare", "adopt"]);
  expect(edit.plan.tasks.some((t) => t.milestoneId === "watch")).toBe(false);
  expect(edit.plan.tasks).toHaveLength(plan.tasks.length - 2);
  expect(edit.plan.milestones[2].approver).toBe("Peter confirms the filing and closes the signal");
  expect(edit.plan.proposedApproach).not.toContain("watches the window");
  expect(edit.plan.proposedApproach.endsWith("the website.")).toBe(true);
  expect(edit.reply).toContain("Milestone 4, Watch the nomination window");
  expect(edit.reply).toContain('"Peter confirms the filing and closes the signal."');
});

test("it understands looser wording", () => {
  for (const text of ["drop milestone four and move its closing step to 3", "please delete m4, closing action into milestone three"]) {
    expect(planEditFromChat(plan, text)?.plan.milestones[2].approver, text).toBe(
      "Peter confirms the filing and closes the signal",
    );
  }
});

test("removing without naming a new home for the closing step says so", () => {
  const edit = planEditFromChat(plan, "remove milestone 4")!;
  expect(edit.plan.milestones).toHaveLength(3);
  expect(edit.plan.milestones[2].approver).toBe("Peter confirms the filing");
  expect(edit.reply).toMatch(/went with it/);
});

test("it leaves other messages, and missing milestones, alone", () => {
  expect(planEditFromChat(plan, "Who owns the 8-K?")).toBeUndefined();
  const missing = planEditFromChat(plan, "remove milestone 9")!;
  expect(missing.plan).toBe(plan);
  expect(missing.reply).toMatch(/no Milestone 9/);
});
