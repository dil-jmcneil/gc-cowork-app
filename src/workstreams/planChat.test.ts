import { ATG_RULING } from "@/signals/signals";

import { planEditFromChat } from "./planChat";
import { draftWorkstreamFromSignal } from "./workstreamDraft";

const plan = draftWorkstreamFromSignal(ATG_RULING).plan;
const PROMPT = "Remove task 4 and add the closing step to task 3.";

test("removing task 4 drops it, and task 3 takes over the closing step", () => {
  const edit = planEditFromChat(plan, PROMPT)!;
  expect(edit.plan.tasks.map((t) => t.id)).toEqual(["atg-v-lane-counsel", "atg-v-lane-prepare", "atg-v-lane-adopt"]);
  expect(edit.plan.tasks[2].doneWhen).toMatch(/Peter confirms the filing and closes the signal\.$/);
  expect(edit.plan.proposedApproach).not.toContain("watches the window");
  expect(edit.reply).toContain("Task 4, Watch the nomination window");
  expect(edit.reply).toContain("Peter confirms the filing and closes the signal");
});

test("it understands looser wording, and still knows milestones by their old name", () => {
  for (const text of [
    "drop task four and move its closing step to 3",
    "please delete milestone 4, closing action into task three",
  ]) {
    expect(planEditFromChat(plan, text)?.plan.tasks[2].doneWhen, text).toMatch(/and closes the signal\.$/);
  }
});

test("removing without naming a new home for the closing step says so", () => {
  const edit = planEditFromChat(plan, "remove task 4")!;
  expect(edit.plan.tasks).toHaveLength(3);
  expect(edit.plan.tasks[2].doneWhen).toMatch(/Peter confirms the filing\.$/);
  expect(edit.reply).toMatch(/went with it/);
});

test("a task that waited on the removed one stops waiting", () => {
  const edit = planEditFromChat(plan, "remove task 1")!;
  expect(edit.plan.tasks.find((t) => t.id === "atg-v-lane-prepare")!.waitingOn).toBeUndefined();
});

test("it leaves other messages, and missing tasks, alone", () => {
  expect(planEditFromChat(plan, "Who owns the 8-K?")).toBeUndefined();
  const missing = planEditFromChat(plan, "remove task 9")!;
  expect(missing.plan).toBe(plan);
  expect(missing.reply).toMatch(/no task 9/);
});
