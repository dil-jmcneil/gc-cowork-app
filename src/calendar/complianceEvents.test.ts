import { deriveCalendarEvents } from "@/calendar/complianceEvents";
import type { Workstream } from "@/workstreams/workstream";
import { DIRECTORY } from "@/workstreams/people";
import { ATG_RULING, SIGNALS, PAST_SIGNALS } from "@/signals/signals";

const NOW = new Date("2026-11-01T00:00:00Z");
const owner = (name: string) => DIRECTORY.find((p) => p.label === name)!;

const WORKSTREAM: Workstream = {
  id: "workstream-1",
  name: "Online cancellation update",
  sourceSignalId: "atg-v-lane",
  description: "d",
  reasonsRelevant: [],
  statusSummary: "s",
  createdAt: "2026-10-01T00:00:00Z",
  plan: {
    proposedApproach: "p",
    status: "accepted",
    milestones: [],
    rules: [],
    tasks: [
      {
        id: "t1",
        milestoneId: "m1",
        description: "Compare the rule against our policies",
        delegator: "Peter",
        delegate: owner("Maya Chen"),
        ccs: [],
        deadline: "2026-10-20",
        status: "Done",
        history: [],
      },
      {
        id: "t2",
        milestoneId: "m1",
        description: "Build the online cancellation flow",
        delegator: "Peter",
        delegate: owner("Jordan Lee"),
        ccs: [],
        deadline: "2026-10-25",
        status: "In progress",
        history: [],
      },
      {
        id: "t3",
        milestoneId: "m1",
        description: "Update customer terms §7",
        delegator: "Peter",
        delegate: owner("Sam Ortiz"),
        ccs: [],
        deadline: "2026-12-01",
        status: "In progress",
        history: [],
      },
      {
        id: "t4",
        milestoneId: "m1",
        description: "Brief the board",
        delegator: "Peter",
        delegate: owner("Alex Kim"),
        ccs: [],
        deadline: "2027-03-01",
        status: "Not started",
        history: [],
      },
    ],
  },
};

const events = () => deriveCalendarEvents([WORKSTREAM], NOW);
const byId = (id: string) => events().find((e) => e.id === id)!;

test("every regulatory deadline shows as an external deadline, with or without a workstream", () => {
  const externals = events().filter((e) => e.kind === "external");
  const expected = SIGNALS.reduce((n, c) => n + c.deadlines.length, 0);
  expect(externals).toHaveLength(expected);
  for (const event of externals) {
    expect(event.status).toBe("External");
    expect(event.signalId).toBeDefined();
  }
});

test("a change with no workstream yet has no tasks on the calendar, only its external deadlines", () => {
  const ruling = deriveCalendarEvents([], NOW).filter((e) => e.source === ATG_RULING.title);
  expect(ruling.length).toBe(ATG_RULING.deadlines.length);
  expect(ruling.every((e) => e.kind === "external")).toBe(true);
});

test("an external deadline whose signal has no workstream is awaiting your response", () => {
  const event = deriveCalendarEvents([], NOW).find((e) => e.kind === "external" && e.signalId === ATG_RULING.id)!;
  expect(event.attention).toBe("awaiting-response");
});

test("a past signal's deadline needs no response, because it was already handled", () => {
  for (const signal of PAST_SIGNALS) {
    for (const event of deriveCalendarEvents([], NOW).filter((e) => e.kind === "external" && e.signalId === signal.id)) {
      expect(event.attention, signal.id).toBeUndefined();
    }
  }
});

test("past workstreams' tasks are on the calendar as display-only events, mostly done", () => {
  const reference = deriveCalendarEvents([], NOW).filter((e) => e.kind === "reference");
  const pastTasks = PAST_SIGNALS.flatMap((i) => i.pastWorkstream?.tasks ?? []);
  expect(reference).toHaveLength(pastTasks.length);
  expect(reference.every((e) => !("href" in e) || e.href === undefined)).toBe(true);
  const done = reference.filter((e) => e.status === "Complete").length;
  expect(done * 2).toBeGreaterThan(reference.length);
});

test("an open past task that slipped its date asks for a nudge", () => {
  const vendor = deriveCalendarEvents([], new Date("2026-11-04T00:00:00Z")).find((e) => e.id === "climate-assurance")!;
  expect(vendor).toMatchObject({ kind: "reference", status: "Blocked", attention: "nudge", owner: "Maya Chen" });
});

test("an external deadline whose change has a workstream needs no attention", () => {
  const atg = events().filter((e) => e.kind === "external" && e.signalId === ATG_RULING.id);
  expect(atg.length).toBeGreaterThan(0);
  for (const event of atg) expect(event.attention).toBeUndefined();
});

test("task events point at their workstream and task", () => {
  const event = byId("t3");
  expect(event).toMatchObject({
    kind: "task",
    workstreamId: "workstream-1",
    taskId: "t3",
  });
  expect(event.owner).toBe("Sam Ortiz");
});

test("a done task is Complete regardless of its date", () => {
  expect(byId("t1").status).toBe("Complete");
  expect(byId("t1").attention).toBeUndefined();
});

test("an unfinished task past its deadline is Blocked and asks for a nudge", () => {
  expect(byId("t2")).toMatchObject({ status: "Blocked", attention: "nudge" });
  expect(byId("t2").description).toContain("Jordan Lee");
});

test("an in-progress task that isn't overdue shows a new status", () => {
  expect(byId("t3")).toMatchObject({
    status: "Assigned",
    attention: "new-status",
  });
});

test("a not-started task that isn't due yet is Assigned with no attention", () => {
  expect(byId("t4")).toMatchObject({ status: "Assigned" });
  expect(byId("t4").attention).toBeUndefined();
});

test("every event says what it links to and suggests a next step", () => {
  for (const event of events()) {
    expect(event.linkLabel.length).toBeGreaterThan(0);
    expect(event.nextStep.length).toBeGreaterThan(0);
  }
});

test("events are sorted by date, earliest first", () => {
  const dates = events().map((e) => e.date);
  expect(dates).toEqual([...dates].sort());
});
