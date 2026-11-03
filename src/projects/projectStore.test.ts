import { draftProjectFromInsight } from "@/projects/projectDraft";
import { SEED_PROJECTS, useProjectStore } from "@/projects/projectStore";
import { ATG_RULING, INSIGHTS } from "@/insights/insights";

beforeEach(() => useProjectStore.setState({ projects: [...SEED_PROJECTS] }));

test("no insight has a project until the GC starts one", () => {
  const { getProjectForInsight } = useProjectStore.getState();
  for (const insight of INSIGHTS) expect(getProjectForInsight(insight.id)).toBeUndefined();
});

test("createProject stores the project and links it to its change", () => {
  const draft = {
    ...draftProjectFromInsight(ATG_RULING),
    name: "Advance notice bylaw update",
  };
  const project = useProjectStore.getState().createProject(draft);
  expect(project.name).toBe("Advance notice bylaw update");
  expect(project.statusSummary.length).toBeGreaterThan(0);
  expect(useProjectStore.getState().getProjectForInsight(ATG_RULING.id)).toBe(project);
  expect(useProjectStore.getState().getProject(project.id)).toBe(project);
});

test("createProject falls back to the change title when the name is blank", () => {
  const draft = { ...draftProjectFromInsight(ATG_RULING), name: "   " };
  expect(useProjectStore.getState().createProject(draft).name).toBe(ATG_RULING.title);
});

test("acceptPlan marks the plan accepted", () => {
  const project = useProjectStore.getState().createProject(draftProjectFromInsight(ATG_RULING));
  useProjectStore.getState().acceptPlan(project.id);
  expect(useProjectStore.getState().getProject(project.id)!.plan.status).toBe("accepted");
});

describe("task actions", () => {
  let PROJECT_ID = "";
  beforeEach(() => {
    PROJECT_ID = useProjectStore.getState().createProject(draftProjectFromInsight(ATG_RULING)).id;
  });
  const firstTask = () => useProjectStore.getState().getProject(PROJECT_ID)!.plan.tasks[0];

  test("assignTask changes the owner and emails the new one", () => {
    const jordan = {
      id: "jordan.lee@acme.com",
      label: "Jordan Lee",
      detail: "Privacy counsel",
      kind: "directory" as const,
    };
    useProjectStore.getState().assignTask(PROJECT_ID, firstTask().id, jordan);
    const task = firstTask();
    expect(task.delegate.label).toBe("Jordan Lee");
    const last = task.history[task.history.length - 1];
    expect(last).toMatchObject({
      authorRole: "cowork",
      channel: "email",
      to: ["Jordan Lee"],
    });
  });

  test("setTaskStatus updates the status and records it as an action in the history", () => {
    useProjectStore.getState().setTaskStatus(PROJECT_ID, firstTask().id, "Done");
    const task = firstTask();
    expect(task.status).toBe("Done");
    expect(task.history[task.history.length - 1]).toMatchObject({ kind: "action", actor: "Peter", summary: "Set the status to Done" });
  });

  test("nudgeTask sends the owner a reminder email", () => {
    const before = firstTask().history.length;
    useProjectStore.getState().nudgeTask(PROJECT_ID, firstTask().id);
    const task = firstTask();
    expect(task.history).toHaveLength(before + 1);
    expect(task.history[before]).toMatchObject({
      authorRole: "cowork",
      channel: "email",
    });
    expect(task.history[before].body).toMatch(/reminder|following up/i);
  });

  test("messageDelegate sends the owner an email on Peter's behalf", () => {
    useProjectStore.getState().messageDelegate(PROJECT_ID, firstTask().id, "Can you send the list today?");
    const last = firstTask().history.at(-1)!;
    expect(last).toMatchObject({ authorRole: "cowork", channel: "email" });
    expect(last.body).toContain("Can you send the list today?");
  });

  test("addChatNote records Peter's chat message, then Cowork passes it on by email", () => {
    const before = firstTask().history.length;
    useProjectStore.getState().addChatNote(PROJECT_ID, firstTask().id, "Loop in legal ops too.");
    const task = firstTask();
    expect(task.history[before]).toMatchObject({
      authorRole: "delegator",
      channel: "chat",
      body: "Loop in legal ops too.",
    });
    expect(task.history[before + 1]).toMatchObject({
      authorRole: "cowork",
      channel: "email",
    });
  });
});
