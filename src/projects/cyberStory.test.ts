import { draftProjectFromChange } from "@/projects/projectDraft";
import { SEED_PROJECTS, useProjectStore } from "@/projects/projectStore";
import { CYBER_RULE_CHANGE, REGULATORY_CHANGES } from "@/regulatory/regulatoryChanges";

beforeEach(() => useProjectStore.setState({ projects: [...SEED_PROJECTS] }));

function startCyberProject() {
  const draft = draftProjectFromChange(CYBER_RULE_CHANGE);
  return useProjectStore.getState().createProject({ ...draft, plan: { ...draft.plan, status: "accepted" } });
}

test("starting the cyber project fills its tasks in as if work began a few days ago", () => {
  const project = startCyberProject();
  const [irp, signoff, preread] = project.plan.tasks;
  expect(irp.status).toBe("In progress");
  expect(signoff.status).toBe("Done");
  expect(signoff.delegate.label).toBe("Raj Patel");
  expect(preread.status).toBe("Not started");
  for (const task of project.plan.tasks) {
    expect(task.thread.length).toBeGreaterThan(0);
    expect(task.statusSummary?.length).toBeGreaterThan(0);
  }
  expect(project.createdAt < irp.thread[0].sentAt).toBe(true);
});

test("the cyber threads mix email replies with notes added through chat", () => {
  const project = startCyberProject();
  const all = project.plan.tasks.flatMap((t) => t.thread);
  expect(all.some((m) => m.channel === "email" && m.authorRole === "delegate")).toBe(true);
  expect(all.some((m) => m.channel === "chat" && m.authorRole === "delegator")).toBe(true);
  expect(all.some((m) => m.attachments?.some((a) => a.includes("redline")))).toBe(true);
});

test("each thread is in time order", () => {
  for (const task of startCyberProject().plan.tasks) {
    const times = task.thread.map((m) => m.sentAt);
    expect(times).toEqual([...times].sort());
  }
});

test("any other new project starts with Cowork's assignment email on every task", () => {
  useProjectStore.setState({ projects: [] });
  const draft = draftProjectFromChange(REGULATORY_CHANGES.find((c) => c.id === "eu-ai-act-gpai")!);
  const project = useProjectStore.getState().createProject(draft);
  for (const task of project.plan.tasks) {
    expect(task.thread).toHaveLength(1);
    expect(task.thread[0]).toMatchObject({ authorRole: "cowork", channel: "email" });
    expect(task.thread[0].to).toEqual([task.delegate.label]);
  }
});
