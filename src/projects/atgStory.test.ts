import { ATG_RULING } from "@/insights/insights";
import { currentMilestone } from "@/projects/milestones";
import { isMessage } from "@/projects/thread";
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
  for (const task of project.plan.tasks) expect(task.history.length).toBeGreaterThan(0);
  expect(project.plan.tasks.find((t) => t.id.endsWith("-agenda"))!.status).toBe("Done");
  expect(currentMilestone(project.plan.milestones, project.plan.tasks)?.id).toBe("assess");
  expect(project.createdAt <= project.plan.tasks.flatMap((t) => t.history.map((e) => e.sentAt)).sort()[0]).toBe(true);
});

test("Cowork shows Peter its first email to outside counsel, and sends it only after he says so", () => {
  const messages = byKey("memo").history.filter(isMessage);
  expect(messages[0]).toMatchObject({ authorRole: "cowork", channel: "chat", to: ["Peter"] });
  expect(messages[1]).toMatchObject({ authorRole: "delegator", body: "Send." });
  expect(messages[2]).toMatchObject({ authorRole: "cowork", channel: "email", to: ["Dana Whitfield"] });
});

test("an owner waiting on another task has follow-ups held, as an action citing the rule", () => {
  const last = byKey("questionnaire").history.at(-1)!;
  expect(last).toMatchObject({ kind: "action", actor: "Cowork", summary: "Held follow-ups for Alex" });
  expect(last.kind === "action" && last.rule).toMatch(/waiting on another task/);
});

test("a silent owner is chased toward the circuit breaker", () => {
  const messages = byKey("website").history.filter(isMessage);
  expect(messages.some((m) => m.authorRole === "delegate")).toBe(false);
  expect(messages.at(-1)!.body).toContain("Follow-up 1 of 3");
});

test("files owners attach and artifacts Cowork makes show up as file entries", () => {
  const files = startAtgProject().plan.tasks.flatMap((t) => t.history.filter((e) => e.kind === "file"));
  expect(files.map((f) => f.kind === "file" && f.addedBy)).toEqual(expect.arrayContaining(["Cowork", "Alex Kim", "Pete Lin"]));
});

test("each thread is in time order", () => {
  for (const task of startAtgProject().plan.tasks) {
    const times = task.history.map((m) => m.sentAt);
    expect(times).toEqual([...times].sort());
  }
});

