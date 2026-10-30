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

describe("task actions", () => {
  const PROJECT_ID = "project-cppa-automated-decisions";
  const firstTask = () => useProjectStore.getState().getProject(PROJECT_ID)!.plan.tasks[0];

  test("assignTask changes the owner and emails the new one", () => {
    const jordan = { id: "jordan.lee@acme.com", label: "Jordan Lee", detail: "Privacy counsel", kind: "directory" as const };
    useProjectStore.getState().assignTask(PROJECT_ID, firstTask().id, jordan);
    const task = firstTask();
    expect(task.delegate.label).toBe("Jordan Lee");
    const last = task.thread[task.thread.length - 1];
    expect(last).toMatchObject({ authorRole: "cowork", channel: "email", to: ["Jordan Lee"] });
  });

  test("setTaskStatus updates the status and records it in the thread", () => {
    useProjectStore.getState().setTaskStatus(PROJECT_ID, firstTask().id, "Done");
    const task = firstTask();
    expect(task.status).toBe("Done");
    expect(task.thread[task.thread.length - 1].body).toMatch(/Done/);
  });

  test("nudgeTask sends the owner a reminder email", () => {
    const before = firstTask().thread.length;
    useProjectStore.getState().nudgeTask(PROJECT_ID, firstTask().id);
    const task = firstTask();
    expect(task.thread).toHaveLength(before + 1);
    expect(task.thread[before]).toMatchObject({ authorRole: "cowork", channel: "email" });
    expect(task.thread[before].body).toMatch(/reminder|following up/i);
  });

  test("messageDelegate sends the owner an email on Peter's behalf", () => {
    useProjectStore.getState().messageDelegate(PROJECT_ID, firstTask().id, "Can you send the list today?");
    const last = firstTask().thread.at(-1)!;
    expect(last).toMatchObject({ authorRole: "cowork", channel: "email" });
    expect(last.body).toContain("Can you send the list today?");
  });

  test("addChatNote records Peter's chat message, then Cowork passes it on by email", () => {
    const before = firstTask().thread.length;
    useProjectStore.getState().addChatNote(PROJECT_ID, firstTask().id, "Loop in legal ops too.");
    const task = firstTask();
    expect(task.thread[before]).toMatchObject({ authorRole: "delegator", channel: "chat", body: "Loop in legal ops too." });
    expect(task.thread[before + 1]).toMatchObject({ authorRole: "cowork", channel: "email" });
  });
});
