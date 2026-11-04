import { deriveCalendarEvents } from "@/calendar/complianceEvents";
import { handleTaskChatMessage } from "@/workstreams/taskChat";
import { temporalBand } from "@/calendar/weeks";
import { ATG_RULING } from "@/signals/signals";
import { taskDisplayStatus } from "@/workstreams/taskStatus";
import { workstreamAttention } from "@/workstreams/workstreamAttention";
import { handleWorkstreamChatMessage } from "@/workstreams/workstreamChat";
import { isMessage } from "@/workstreams/thread";
import { draftWorkstreamFromSignal } from "@/workstreams/workstreamDraft";
import { SEED_WORKSTREAMS, useWorkstreamStore } from "@/workstreams/workstreamStore";

const NOW = new Date("2026-11-03T12:00:00Z");
const COUNSEL = `${ATG_RULING.id}-counsel`;
const PREPARE = `${ATG_RULING.id}-prepare`;

beforeEach(() => useWorkstreamStore.setState({ workstreams: [...SEED_WORKSTREAMS] }));

function startAtgWorkstream() {
  const draft = draftWorkstreamFromSignal(ATG_RULING);
  return useWorkstreamStore.getState().createWorkstream({ ...draft, plan: { ...draft.plan, status: "accepted" } });
}

const byKey = (key: string) => startAtgWorkstream().plan.tasks.find((t) => t.id === `${ATG_RULING.id}-${key}`)!;

/** Each task's display status, keyed by its template id. */
function statuses(workstreamId: string) {
  const { tasks } = useWorkstreamStore.getState().getWorkstream(workstreamId)!.plan;
  return Object.fromEntries(tasks.map((t) => [t.id.slice(ATG_RULING.id.length + 1), taskDisplayStatus(t, tasks)]));
}

test("starting the workstream fills its tasks in as if work began a few days ago", () => {
  const workstream = startAtgWorkstream();
  for (const task of workstream.plan.tasks) expect(task.history.length).toBeGreaterThan(0);
  expect(workstream.createdAt <= workstream.plan.tasks.flatMap((t) => t.history.map((e) => e.sentAt)).sort()[0]).toBe(
    true,
  );
});

test("Cowork shows Peter its first email to outside counsel, and sends it only once Peter says so", () => {
  const messages = byKey("counsel").history.filter(isMessage);
  expect(messages[0]).toMatchObject({ authorRole: "cowork", channel: "chat", to: ["Peter"] });
  expect(messages[1]).toMatchObject({ authorRole: "delegator", body: "Send." });
  expect(messages[2]).toMatchObject({ authorRole: "cowork", channel: "email", to: ["Dana Whitfield"] });
});

test("an owner waiting on another task has follow-ups held, as an action citing the rule", () => {
  const held = byKey("prepare").history.find((e) => e.kind === "action" && e.summary === "Held follow-ups for Alex")!;
  expect(held.kind === "action" && held.rule).toMatch(/waiting on another task/);
});

test("files owners attach and artifacts Cowork makes show up as file entries", () => {
  const files = startAtgWorkstream().plan.tasks.flatMap((t) => t.history.filter((e) => e.kind === "file"));
  expect(files.map((f) => f.kind === "file" && f.addedBy)).toEqual(
    expect.arrayContaining(["Cowork", "Alex Kim", "Pete Lin"]),
  );
});

test("each thread is in time order", () => {
  for (const task of startAtgWorkstream().plan.tasks) {
    const times = task.history.map((m) => m.sentAt);
    expect(times).toEqual([...times].sort());
  }
});

test("the first two tasks land this week and next on the calendar, so the widget shows them", () => {
  const TODAY = "2026-11-03";
  expect(temporalBand(byKey("counsel").deadline, TODAY)).toBe("this-week");
  expect(temporalBand(byKey("prepare").deadline, TODAY)).toBe("next-week");
  expect(byKey("prepare").deadline < ATG_RULING.deadlines[0].date).toBe(true);
});

describe("Dana finished counsel's view, and it waits on Peter's review", () => {
  test("Dana's done doesn't close it; Cowork holds it open and asks Peter", () => {
    const counsel = byKey("counsel");
    expect(counsel.status).toBe("In progress");
    expect(counsel.awaitingReview).toBe(true);
    const last = counsel.history.slice(-3);
    expect(last[0]).toMatchObject({ kind: "message", authorRole: "delegate", authorName: "Dana Whitfield" });
    expect(last[1]).toMatchObject({ kind: "action", summary: "Held the task open for your review" });
    expect(last[2]).toMatchObject({ kind: "message", authorRole: "cowork", to: ["Peter"] });
  });

  test("confirming closes it and records who closed it", () => {
    const workstream = startAtgWorkstream();
    useWorkstreamStore.getState().confirmTaskDone(workstream.id, COUNSEL);
    const counsel = useWorkstreamStore.getState().getTask(workstream.id, COUNSEL)!;
    expect(counsel).toMatchObject({ status: "Done", awaitingReview: false });
    expect(counsel.statusSummary).toMatch(/^You confirmed Dana's work on \w+ \d+\.$/);
    expect(counsel.history.at(-1)).toMatchObject({ kind: "action", actor: "Peter" });
  });

  test('replying "Got it" in the task chat closes it too', () => {
    const workstream = startAtgWorkstream();
    const reply = handleTaskChatMessage(workstream.id, COUNSEL, "Got it, looks good", new Date());
    expect(reply).toMatch(/closed the task/);
    expect(useWorkstreamStore.getState().getTask(workstream.id, COUNSEL)!.status).toBe("Done");
  });

  test("the calendar asks for a review, not a nudge, and its Review opens the workstream on the task", () => {
    const workstream = startAtgWorkstream();
    const event = deriveCalendarEvents([workstream], NOW).find((e) => e.id === COUNSEL)!;
    expect(event.priority.label).toBe("Needs your review");
    expect(event.attention).toBe("review");
    expect(event.href).toBe(`/workstreams/${workstream.id}?task=${COUNSEL}`);
  });
});

describe("the demo: counsel's view needs your review, and clearing it moves the story on", () => {
  test("at the start, counsel's view needs your review, and preparing the change is blocked by you", () => {
    const { id } = startAtgWorkstream();
    expect(statuses(id)).toEqual({
      counsel: { label: "Needs your review" },
      prepare: { label: "Blocked", blockedBy: "you" },
      adopt: { label: "Blocked", blockedBy: "Alex Kim" },
      watch: { label: "In progress" },
    });
    expect(workstreamAttention(useWorkstreamStore.getState().getWorkstream(id)!, NOW).summary.headline).toMatch(
      /^Review Dana's memo/,
    );
  });

  test.each([
    ["the status summary", (id: string) => useWorkstreamStore.getState().confirmTaskDone(id, COUNSEL)],
    ['the chat reply "Got it"', (id: string) => void handleWorkstreamChatMessage(id, "Got it", NOW)],
  ])("clearing it from %s unblocks preparing the change", (_, clear) => {
    const { id } = startAtgWorkstream();
    clear(id);
    expect(statuses(id)).toMatchObject({ counsel: { label: "Done" }, prepare: { label: "In progress" } });
    const { summary, waitingOnYou } = workstreamAttention(useWorkstreamStore.getState().getWorkstream(id)!, NOW);
    expect(waitingOnYou).toHaveLength(0);
    expect(summary.headline).toBe("On track: 1 of 4 tasks done.");
  });

  test("Cowork tells Alex the text is approved, and the activity log shows it", () => {
    const { id } = startAtgWorkstream();
    useWorkstreamStore.getState().confirmTaskDone(id, COUNSEL);
    const prepare = useWorkstreamStore.getState().getTask(id, PREPARE)!;
    const [email, action] = prepare.history.slice(-2);
    expect(email).toMatchObject({ kind: "message", authorRole: "cowork", channel: "email", to: ["Alex Kim"] });
    expect(action).toMatchObject({ kind: "action", actor: "Cowork", summary: "Told Alex the draft text is approved" });
    expect(action.kind === "action" && action.rule).toMatch(/draft text is approved/);
    expect(prepare.statusSummary).toMatch(/so Alex can start the questionnaire/);
  });

  test("confirming twice doesn't tell Alex twice", () => {
    const { id } = startAtgWorkstream();
    useWorkstreamStore.getState().confirmTaskDone(id, COUNSEL);
    useWorkstreamStore.getState().confirmTaskDone(id, COUNSEL);
    const prepare = useWorkstreamStore.getState().getTask(id, PREPARE)!;
    expect(prepare.history.filter((e) => e.kind === "action" && e.summary.startsWith("Told Alex"))).toHaveLength(1);
  });
});
