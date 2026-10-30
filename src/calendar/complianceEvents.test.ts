import { deriveCalendarEvents } from "@/calendar/complianceEvents";
import type { Project } from "@/projects/project";
import { DIRECTORY } from "@/projects/people";
import { CYBER_RULE_CHANGE, REGULATORY_CHANGES } from "@/regulatory/regulatoryChanges";

const NOW = new Date("2026-11-01T00:00:00Z");
const owner = (name: string) => DIRECTORY.find((p) => p.label === name)!;

const PROJECT: Project = {
  id: "project-1",
  name: "Online cancellation update",
  sourceChangeId: "ftc-click-to-cancel",
  description: "d",
  reasonsRelevant: [],
  statusSummary: "s",
  createdAt: "2026-10-01T00:00:00Z",
  plan: {
    proposedApproach: "p",
    status: "accepted",
    tasks: [
      {
        id: "t1",
        description: "Compare the rule against our policies",
        delegator: "Peter",
        delegate: owner("Maya Chen"),
        ccs: [],
        deadline: "2026-10-20",
        status: "Done",
        thread: [],
      },
      {
        id: "t2",
        description: "Build the online cancellation flow",
        delegator: "Peter",
        delegate: owner("Jordan Lee"),
        ccs: [],
        deadline: "2026-10-25",
        status: "In progress",
        thread: [],
      },
      {
        id: "t3",
        description: "Update customer terms §7",
        delegator: "Peter",
        delegate: owner("Sam Ortiz"),
        ccs: [],
        deadline: "2026-12-01",
        status: "In progress",
        thread: [],
      },
      {
        id: "t4",
        description: "Brief the board",
        delegator: "Peter",
        delegate: owner("Alex Kim"),
        ccs: [],
        deadline: "2027-03-01",
        status: "Not started",
        thread: [],
      },
    ],
  },
};

const events = () => deriveCalendarEvents([PROJECT], NOW);
const byId = (id: string) => events().find((e) => e.id === id)!;

test("every regulatory deadline shows as an external deadline, with or without a project", () => {
  const externals = events().filter((e) => e.kind === "external");
  const expected = REGULATORY_CHANGES.reduce((n, c) => n + c.deadlines.length, 0);
  expect(externals).toHaveLength(expected);
  for (const event of externals) {
    expect(event.status).toBe("External");
    expect(event.changeId).toBeDefined();
  }
});

test("a change with no project yet has no tasks on the calendar, only its external deadlines", () => {
  const cyber = deriveCalendarEvents([], NOW).filter((e) => e.source === CYBER_RULE_CHANGE.title);
  expect(cyber.length).toBe(CYBER_RULE_CHANGE.deadlines.length);
  expect(cyber.every((e) => e.kind === "external")).toBe(true);
});

test("an external deadline whose change has no project is awaiting your response", () => {
  const event = deriveCalendarEvents([], NOW).find((e) => e.kind === "external")!;
  expect(event.attention).toBe("awaiting-response");
});

test("an external deadline whose change has a project needs no attention", () => {
  const ftc = events().filter((e) => e.kind === "external" && e.changeId === "ftc-click-to-cancel");
  expect(ftc.length).toBeGreaterThan(0);
  for (const event of ftc) expect(event.attention).toBeUndefined();
});

test("task events point at their project and task", () => {
  const event = byId("t3");
  expect(event).toMatchObject({ kind: "task", projectId: "project-1", taskId: "t3" });
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
  expect(byId("t3")).toMatchObject({ status: "Assigned", attention: "new-status" });
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
