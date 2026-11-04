import { hasPlan } from "@/signals/signal";
import { draftWorkstreamFromSignal } from "@/workstreams/workstreamDraft";
import { ATG_RULING, SIGNALS } from "@/signals/signals";

test("draft defaults to the signal's title, description, and reasons", () => {
  const draft = draftWorkstreamFromSignal(ATG_RULING);
  expect(draft.name).toBe(ATG_RULING.title);
  expect(draft.sourceSignalId).toBe(ATG_RULING.id);
  expect(draft.description).toBe(ATG_RULING.summary);
  expect(draft.reasonsRelevant).toEqual(ATG_RULING.reasonsRelevant);
});

test("each task template becomes a draft task with its owner, CC, due date and what done looks like", () => {
  const { plan } = draftWorkstreamFromSignal(ATG_RULING);
  expect(plan.status).toBe("draft");
  expect(plan.tasks).toHaveLength(ATG_RULING.plan.tasks.length);
  ATG_RULING.plan.tasks.forEach((template, i) => {
    const task = plan.tasks[i];
    expect(task.id).toBe(`${ATG_RULING.id}-${template.id}`);
    expect(task.description).toBe(template.description);
    expect(task.doneWhen).toBe(template.doneWhen);
    expect(task.deadline).toBe(template.due);
    expect(task.delegate.id.replace(/^email:/, "")).toBe(template.ownerEmail);
    expect(task.ccs.map((c) => c.id)).toEqual(template.ccEmails);
    expect(task.delegator).toBe("Peter");
    expect(task.status).toBe("Not started");
    expect(task.history).toEqual([]);
  });
});

test("the plan is four big-picture tasks, and preparing the change waits on counsel's view", () => {
  const { plan } = draftWorkstreamFromSignal(ATG_RULING);
  expect(plan.tasks.map((t) => t.description)).toEqual([
    "Get counsel's view",
    "Prepare the change",
    "Adopt and disclose the amendment",
    "Watch the nomination window",
  ]);
  expect(plan.tasks[1].waitingOn).toBe(`${ATG_RULING.id}-counsel`);
  expect(plan.tasks[0].doneWhen).toMatch(/^Peter confirms whether the ruling affects Acme's bylaws/);
});

test("done-when lines are end states, each naming who confirms", () => {
  for (const task of draftWorkstreamFromSignal(ATG_RULING).plan.tasks) {
    expect(task.doneWhen, task.description).toMatch(/Peter (confirms|closes)/);
  }
});

test("rule ids are unique, so rows can be edited one at a time", () => {
  const ids = draftWorkstreamFromSignal(ATG_RULING).plan.rules.map((r) => r.id);
  expect(new Set(ids).size).toBe(ids.length);
  expect(draftWorkstreamFromSignal(ATG_RULING).plan.rules.some((r) => r.circuitBreaker)).toBe(true);
});

test("the change is done before the nomination window opens, and watching ends when it closes", () => {
  const [opens, closes] = ATG_RULING.deadlines.map((d) => d.date);
  const tasks = draftWorkstreamFromSignal(ATG_RULING).plan.tasks;
  for (const task of tasks.slice(0, 3)) expect(task.deadline < opens, task.description).toBe(true);
  expect(tasks[3].deadline).toBe(closes);
});

test("draft tasks aren't copies of the change's external deadlines", () => {
  for (const change of SIGNALS.filter(hasPlan)) {
    const labels = new Set(change.deadlines.map((d) => d.label));
    for (const task of draftWorkstreamFromSignal(change).plan.tasks) {
      expect(labels.has(task.description), task.description).toBe(false);
    }
  }
});
