import { ATG_RULING } from "@/insights/insights";
import { currentMilestone } from "@/projects/milestones";
import { draftProjectFromInsight } from "@/projects/projectDraft";
import { SEED_PROJECTS, useProjectStore } from "@/projects/projectStore";

beforeEach(() => useProjectStore.setState({ projects: [...SEED_PROJECTS] }));

function startAtgProject() {
  const draft = draftProjectFromInsight(ATG_RULING);
  return useProjectStore.getState().createProject({ ...draft, plan: { ...draft.plan, status: "accepted" } });
}

const byKey = (key: string) => startAtgProject().plan.tasks.find((t) => t.id === `${ATG_RULING.id}-${key}`)!;

test("starting the project fills its tasks in as if work began a few days ago", () => {
  const project = startAtgProject();
  for (const task of project.plan.tasks) expect(task.thread.length).toBeGreaterThan(0);
  expect(project.plan.tasks.find((t) => t.id.endsWith("-agenda"))!.status).toBe("Done");
  expect(currentMilestone(project.plan.milestones, project.plan.tasks)?.id).toBe("assess");
  expect(project.createdAt <= project.plan.tasks[0].thread[0].sentAt).toBe(true);
});

test("Cowork shows Peter its first email to outside counsel, and sends it only after he says so", () => {
  const thread = byKey("memo").thread;
  expect(thread[0]).toMatchObject({ authorRole: "cowork", channel: "chat", to: ["Peter"] });
  expect(thread[1]).toMatchObject({ authorRole: "delegator", body: "Send." });
  expect(thread[2]).toMatchObject({ authorRole: "cowork", channel: "email", to: ["Dana Whitfield"] });
});

test("an owner waiting on another task has follow-ups held", () => {
  const thread = byKey("questionnaire").thread;
  expect(thread.at(-1)!.body).toMatch(/holding follow-ups/);
});

test("a silent owner is chased toward the circuit breaker", () => {
  const thread = byKey("website").thread;
  expect(thread.some((m) => m.authorRole === "delegate")).toBe(false);
  expect(thread.at(-1)!.body).toContain("Follow-up 1 of 3");
});

test("each thread is in time order", () => {
  for (const task of startAtgProject().plan.tasks) {
    const times = task.thread.map((m) => m.sentAt);
    expect(times).toEqual([...times].sort());
  }
});

