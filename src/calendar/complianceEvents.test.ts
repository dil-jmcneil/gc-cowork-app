import { deriveCalendarEvents } from "@/calendar/complianceEvents";
import type { Project } from "@/projects/project";
import { CYBER_RULE_CHANGE } from "@/regulatory/regulatoryChanges";

const NOW = new Date("2026-11-01T00:00:00Z");

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
        delegate: { id: "a", label: "Maya Chen", detail: "CISO · maya.chen@acme.com", kind: "directory" },
        ccs: [],
        deadline: "2026-10-20",
        status: "Done",
      },
      {
        id: "t2",
        description: "Update online cancellation flow",
        delegator: "Peter",
        delegate: { id: "b", label: "Jordan Lee", detail: "Privacy counsel", kind: "directory" },
        ccs: [],
        deadline: "2026-10-25",
        status: "In progress",
      },
      {
        id: "t3",
        description: "Rule takes effect",
        delegator: "Peter",
        delegate: { id: "c", label: "Sam Ortiz", detail: "Compliance lead", kind: "directory" },
        ccs: [],
        deadline: "2027-03-01",
        status: "Not started",
      },
    ],
  },
};

test("a task that's done is Complete regardless of its date", () => {
  const events = deriveCalendarEvents([PROJECT], NOW);
  const task = events.find((e) => e.id === "t1")!;
  expect(task.status).toBe("Complete");
});

test("an unfinished task past its deadline is Blocked", () => {
  const events = deriveCalendarEvents([PROJECT], NOW);
  const task = events.find((e) => e.id === "t2")!;
  expect(task.status).toBe("Blocked");
  expect(task.href).toBe("/projects/project-1");
});

test("an unfinished task not yet due is Assigned", () => {
  const events = deriveCalendarEvents([PROJECT], NOW);
  const task = events.find((e) => e.id === "t3")!;
  expect(task.status).toBe("Assigned");
});

test("a regulatory deadline with no project yet appears, linking to create one", () => {
  const events = deriveCalendarEvents([], NOW);
  const deadline = events.find((e) => e.title === "File Form 8-K, Item 1.05")!;
  expect(deadline).toBeDefined();
  expect(deadline.href).toBe(`/projects/new?change=${CYBER_RULE_CHANGE.id}`);
  expect(deadline.status).toBe("Assigned");
});

test("a past regulatory deadline with no project is Blocked", () => {
  const events = deriveCalendarEvents([], NOW);
  const deadline = events.find((e) => e.title.startsWith("Update Incident Response Plan"))!;
  expect(deadline.status).toBe("Blocked");
});

test("once a change has a project, its own deadline events are replaced by that project's tasks", () => {
  const events = deriveCalendarEvents([PROJECT], NOW);
  expect(events.some((e) => e.title === "Update online cancellation flow")).toBe(true);
  expect(events.some((e) => e.title === "Rule takes effect" && e.description.includes("FTC"))).toBe(false);
});

test("events are sorted by date, earliest first", () => {
  const events = deriveCalendarEvents([PROJECT], NOW);
  const dates = events.map((e) => e.date);
  expect(dates).toEqual([...dates].sort());
});

test("an overdue, unfinished task asks for a nudge and says who hasn't responded", () => {
  const event = deriveCalendarEvents([PROJECT], NOW).find((e) => e.id === "t2")!;
  expect(event.attention).toBe("nudge");
  expect(event.owner).toBe("Jordan Lee");
  expect(event.description).toContain("Jordan Lee");
  expect(event.description).toContain("past due");
});

test("an in-progress task that isn't overdue shows a new status", () => {
  const inProgress = {
    ...PROJECT,
    plan: {
      ...PROJECT.plan,
      tasks: [{ ...PROJECT.plan.tasks[1], id: "t4", deadline: "2026-12-01" }],
    },
  };
  const event = deriveCalendarEvents([inProgress], NOW).find((e) => e.id === "t4")!;
  expect(event.attention).toBe("new-status");
  expect(event.status).toBe("Assigned");
});

test("a regulatory deadline with no project is awaiting your response", () => {
  const event = deriveCalendarEvents([], NOW).find((e) => e.title === "File Form 8-K, Item 1.05")!;
  expect(event.attention).toBe("awaiting-response");
  expect(event.source).toBe("New cyber-attack reporting rule");
});

test("a completed task needs no attention", () => {
  const event = deriveCalendarEvents([PROJECT], NOW).find((e) => e.id === "t1")!;
  expect(event.attention).toBeUndefined();
});

test("every event says what it links to and suggests a next step", () => {
  for (const event of deriveCalendarEvents([PROJECT], NOW)) {
    expect(event.linkLabel.length).toBeGreaterThan(0);
    expect(event.nextStep.length).toBeGreaterThan(0);
  }
});
