import { draftProjectFromInsight } from "@/projects/projectDraft";
import { ATG_RULING, INSIGHTS } from "@/insights/insights";

test("draft defaults to the insight's title, description, and reasons", () => {
  const draft = draftProjectFromInsight(ATG_RULING);
  expect(draft.name).toBe(ATG_RULING.title);
  expect(draft.sourceInsightId).toBe(ATG_RULING.id);
  expect(draft.description).toBe(ATG_RULING.summary);
  expect(draft.reasonsRelevant).toEqual(ATG_RULING.reasonsRelevant);
});

test("each milestone's task templates become draft tasks with their owner and due date", () => {
  const { plan } = draftProjectFromInsight(ATG_RULING);
  expect(plan.status).toBe("draft");
  const templates = ATG_RULING.plan.milestones.flatMap((m) => m.tasks.map((t) => ({ ...t, milestoneId: m.id })));
  expect(plan.tasks).toHaveLength(templates.length);
  templates.forEach((template, i) => {
    const task = plan.tasks[i];
    expect(task.milestoneId).toBe(template.milestoneId);
    expect(task.description).toBe(template.description);
    expect(task.deadline).toBe(template.due);
    expect(task.delegate.id.replace(/^email:/, "")).toBe(template.ownerEmail);
    expect(task.delegator).toBe("Peter");
    expect(task.status).toBe("Not started");
    expect(task.thread).toEqual([]);
  });
});

test("the draft keeps the milestone contracts and rules, without the task templates", () => {
  const { plan } = draftProjectFromInsight(ATG_RULING);
  expect(plan.milestones.map((m) => m.id)).toEqual(["assess", "prepare", "adopt", "watch"]);
  for (const milestone of plan.milestones) {
    expect(milestone).not.toHaveProperty("tasks");
    expect(milestone.startsWhen.length).toBeGreaterThan(0);
    expect(milestone.doneWhen.length).toBeGreaterThan(0);
    expect(milestone.rules.length).toBeGreaterThan(0);
  }
  expect(plan.rules.some((r) => r.circuitBreaker)).toBe(true);
});

test("rule ids are unique within their table, so rows can be edited one at a time", () => {
  const { plan } = draftProjectFromInsight(ATG_RULING);
  for (const rules of [plan.rules, ...plan.milestones.map((m) => m.rules)]) {
    const ids = rules.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  }
});

test("every task is due before the nomination window opens", () => {
  const windowOpens = ATG_RULING.deadlines[0].date;
  const { plan } = draftProjectFromInsight(ATG_RULING);
  for (const task of plan.tasks) expect(task.deadline < windowOpens, task.description).toBe(true);
});

test("draft tasks aren't copies of the change's external deadlines", () => {
  for (const change of INSIGHTS) {
    const labels = new Set(change.deadlines.map((d) => d.label));
    for (const task of draftProjectFromInsight(change).plan.tasks) {
      expect(labels.has(task.description), task.description).toBe(false);
    }
  }
});
