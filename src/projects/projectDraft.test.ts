import { draftProjectFromChange } from "@/projects/projectDraft";
import { CYBER_RULE_CHANGE } from "@/regulatory/regulatoryChanges";

test("draft defaults to the change's title, description, and reasons", () => {
  const draft = draftProjectFromChange(CYBER_RULE_CHANGE);
  expect(draft.name).toBe(CYBER_RULE_CHANGE.title);
  expect(draft.sourceChangeId).toBe(CYBER_RULE_CHANGE.id);
  expect(draft.description).toBe(CYBER_RULE_CHANGE.summary);
  expect(draft.reasonsRelevant).toEqual(CYBER_RULE_CHANGE.reasonsRelevant);
});

test("draft plan starts as a draft with tasks that have an owner and a deadline", () => {
  const { plan } = draftProjectFromChange(CYBER_RULE_CHANGE);
  expect(plan.status).toBe("draft");
  expect(plan.proposedApproach.length).toBeGreaterThan(0);
  expect(plan.tasks.length).toBeGreaterThanOrEqual(CYBER_RULE_CHANGE.deadlines.length);
  for (const task of plan.tasks) {
    expect(task.delegator).toBe("Peter");
    expect(task.delegate.length).toBeGreaterThan(0);
    expect(task.deadline).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(task.status).toBe("Not started");
  }
});

test("each rule deadline becomes a task due that day", () => {
  const { plan } = draftProjectFromChange(CYBER_RULE_CHANGE);
  for (const deadline of CYBER_RULE_CHANGE.deadlines) {
    expect(plan.tasks.some((t) => t.description === deadline.label && t.deadline === deadline.date)).toBe(true);
  }
});
