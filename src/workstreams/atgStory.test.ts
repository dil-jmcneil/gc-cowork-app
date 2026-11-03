import { ATG_RULING } from "@/insights/insights";
import { currentMilestone } from "@/workstreams/milestones";
import { isMessage } from "@/workstreams/thread";
import { draftWorkstreamFromInsight } from "@/workstreams/workstreamDraft";
import { SEED_WORKSTREAMS, useWorkstreamStore } from "@/workstreams/workstreamStore";

beforeEach(() => useWorkstreamStore.setState({ workstreams: [...SEED_WORKSTREAMS] }));

function startAtgWorkstream() {
  const draft = draftWorkstreamFromInsight(ATG_RULING);
  return useWorkstreamStore.getState().createWorkstream({ ...draft, plan: { ...draft.plan, status: "accepted" } });
}

const byKey = (key: string) => startAtgWorkstream().plan.tasks.find((t) => t.id === `${ATG_RULING.id}-${key}`)!;

test("starting the workstream fills its tasks in as if work began a few days ago", () => {
  const workstream = startAtgWorkstream();
  for (const task of workstream.plan.tasks) expect(task.history.length).toBeGreaterThan(0);
  expect(workstream.plan.tasks.find((t) => t.id.endsWith("-agenda"))!.status).toBe("Done");
  expect(currentMilestone(workstream.plan.milestones, workstream.plan.tasks)?.id).toBe("assess");
  expect(workstream.createdAt <= workstream.plan.tasks.flatMap((t) => t.history.map((e) => e.sentAt)).sort()[0]).toBe(true);
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
  const files = startAtgWorkstream().plan.tasks.flatMap((t) => t.history.filter((e) => e.kind === "file"));
  expect(files.map((f) => f.kind === "file" && f.addedBy)).toEqual(expect.arrayContaining(["Cowork", "Alex Kim", "Pete Lin"]));
});

test("each thread is in time order", () => {
  for (const task of startAtgWorkstream().plan.tasks) {
    const times = task.history.map((m) => m.sentAt);
    expect(times).toEqual([...times].sort());
  }
});

