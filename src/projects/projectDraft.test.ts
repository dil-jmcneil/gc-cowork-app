import { draftProjectFromChange } from "@/projects/projectDraft";
import { CYBER_RULE_CHANGE, REGULATORY_CHANGES } from "@/regulatory/regulatoryChanges";

test("draft defaults to the change's title, description, and reasons", () => {
  const draft = draftProjectFromChange(CYBER_RULE_CHANGE);
  expect(draft.name).toBe(CYBER_RULE_CHANGE.title);
  expect(draft.sourceChangeId).toBe(CYBER_RULE_CHANGE.id);
  expect(draft.description).toBe(CYBER_RULE_CHANGE.summary);
  expect(draft.reasonsRelevant).toEqual(CYBER_RULE_CHANGE.reasonsRelevant);
});

test("each task template becomes a draft task with its owner and due date", () => {
  for (const change of REGULATORY_CHANGES) {
    const { plan } = draftProjectFromChange(change);
    expect(plan.status).toBe("draft");
    expect(plan.tasks).toHaveLength(change.taskTemplates.length);
    change.taskTemplates.forEach((template, i) => {
      const task = plan.tasks[i];
      expect(task.description).toBe(template.description);
      expect(task.deadline).toBe(template.due);
      expect(task.delegate.id).toBe(template.ownerEmail);
      expect(task.delegate.kind).toBe("directory");
      expect(task.delegator).toBe("Peter");
      expect(task.status).toBe("Not started");
      expect(task.thread).toEqual([]);
    });
  }
});

test("draft tasks aren't copies of the change's external deadlines", () => {
  for (const change of REGULATORY_CHANGES) {
    const labels = new Set(change.deadlines.map((d) => d.label));
    for (const task of draftProjectFromChange(change).plan.tasks) {
      expect(labels.has(task.description), task.description).toBe(false);
    }
  }
});
