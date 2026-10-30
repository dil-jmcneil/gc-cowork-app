import { draftProjectFromChange } from "@/projects/projectDraft";
import { SEED_PROJECTS, useProjectStore } from "@/projects/projectStore";
import { CYBER_RULE_CHANGE, REGULATORY_CHANGES } from "@/regulatory/regulatoryChanges";

beforeEach(() => useProjectStore.setState({ projects: [...SEED_PROJECTS] }));

test("some changes start with a project and the cyber rule does not", () => {
  const { getProjectForChange } = useProjectStore.getState();
  expect(getProjectForChange(CYBER_RULE_CHANGE.id)).toBeUndefined();
  const withProjects = REGULATORY_CHANGES.filter((c) => getProjectForChange(c.id));
  expect(withProjects.length).toBeGreaterThanOrEqual(2);
  for (const change of withProjects) {
    expect(getProjectForChange(change.id)!.statusSummary.length).toBeGreaterThan(0);
  }
});

test("createProject stores the project and links it to its change", () => {
  const draft = { ...draftProjectFromChange(CYBER_RULE_CHANGE), name: "Cyber 8-K readiness" };
  const project = useProjectStore.getState().createProject(draft);
  expect(project.name).toBe("Cyber 8-K readiness");
  expect(project.statusSummary.length).toBeGreaterThan(0);
  expect(useProjectStore.getState().getProjectForChange(CYBER_RULE_CHANGE.id)).toBe(project);
  expect(useProjectStore.getState().getProject(project.id)).toBe(project);
});

test("createProject falls back to the change title when the name is blank", () => {
  const draft = { ...draftProjectFromChange(CYBER_RULE_CHANGE), name: "   " };
  expect(useProjectStore.getState().createProject(draft).name).toBe(CYBER_RULE_CHANGE.title);
});

test("acceptPlan marks the plan accepted", () => {
  const project = useProjectStore.getState().createProject(draftProjectFromChange(CYBER_RULE_CHANGE));
  useProjectStore.getState().acceptPlan(project.id);
  expect(useProjectStore.getState().getProject(project.id)!.plan.status).toBe("accepted");
});
