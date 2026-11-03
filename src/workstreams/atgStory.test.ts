import { deriveCalendarEvents } from "@/calendar/complianceEvents";
import { handleTaskChatMessage } from "@/workstreams/taskChat";
import { temporalBand } from "@/calendar/weeks";
import { ATG_RULING } from "@/signals/signals";
import { currentMilestone } from "@/workstreams/milestones";
import { isMessage } from "@/workstreams/thread";
import { draftWorkstreamFromSignal } from "@/workstreams/workstreamDraft";
import { SEED_WORKSTREAMS, useWorkstreamStore } from "@/workstreams/workstreamStore";

beforeEach(() => useWorkstreamStore.setState({ workstreams: [...SEED_WORKSTREAMS] }));

function startAtgWorkstream() {
  const draft = draftWorkstreamFromSignal(ATG_RULING);
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


test("the early tasks land this week and next on the calendar, so the widget shows them", () => {
  const TODAY = "2026-11-03";
  const due = (key: string) => byKey(key).deadline;
  expect(temporalBand(due("memo"), TODAY)).toBe("this-week");
  expect(temporalBand(due("agenda"), TODAY)).toBe("next-week");
  expect(temporalBand(due("questionnaire"), TODAY)).toBe("next-week");
  // The questionnaire still follows counsel's memo, and everything stays ahead of the window.
  expect(due("questionnaire") > due("memo")).toBe(true);
  expect(due("questionnaire") < ATG_RULING.deadlines[0].date).toBe(true);
});

describe("the memo is done by Dana and waiting on Peter's review", () => {
  test("Dana's done doesn't close it; Cowork holds it open and asks Peter", () => {
    const memo = byKey("memo");
    expect(memo.status).toBe("In progress");
    expect(memo.awaitingReview).toBe(true);
    const last = memo.history.slice(-3);
    expect(last[0]).toMatchObject({ kind: "message", authorRole: "delegate", authorName: "Dana Whitfield" });
    expect(last[1]).toMatchObject({ kind: "action", summary: "Held the task open for your review" });
    expect(last[2]).toMatchObject({ kind: "message", authorRole: "cowork", to: ["Peter"] });
  });

  test("confirming closes it and records who closed it", () => {
    const workstream = startAtgWorkstream();
    useWorkstreamStore.getState().confirmTaskDone(workstream.id, `${ATG_RULING.id}-memo`);
    const memo = useWorkstreamStore.getState().getTask(workstream.id, `${ATG_RULING.id}-memo`)!;
    expect(memo).toMatchObject({ status: "Done", awaitingReview: false });
    expect(memo.history.at(-1)).toMatchObject({ kind: "action", actor: "Peter" });
  });

  test("replying \"Got it\" in the task chat closes it too", () => {
    const workstream = startAtgWorkstream();
    const reply = handleTaskChatMessage(workstream.id, `${ATG_RULING.id}-memo`, "Got it, looks good", new Date());
    expect(reply).toMatch(/closed the task/);
    expect(useWorkstreamStore.getState().getTask(workstream.id, `${ATG_RULING.id}-memo`)!.status).toBe("Done");
  });

  test("the calendar asks for a review, not a nudge", () => {
    const workstream = startAtgWorkstream();
    const event = deriveCalendarEvents([workstream], new Date("2026-11-03T12:00:00Z")).find(
      (e) => e.id === `${ATG_RULING.id}-memo`,
    )!;
    expect(event.priority.label).toBe("Needs your review");
    expect(event.attention).toBe("review");
  });
});
