import type { WorkstreamTask } from "@/workstreams/workstream";
import { DIRECTORY } from "@/workstreams/people";
import { orderedTasks, summarizeTask, taskAttention, taskDisplayStatus } from "@/workstreams/taskStatus";

const NOW = new Date("2026-10-30T12:00:00Z");
const MAYA = DIRECTORY.find((p) => p.label === "Maya Chen")!;

function task(patch: Partial<WorkstreamTask>): WorkstreamTask {
  return {
    id: "t",
    description: "Review the tools",
    doneWhen: "Peter confirms the tools are reviewed.",
    delegator: "Peter",
    delegate: MAYA,
    ccs: [],
    deadline: "2026-11-10",
    status: "Not started",
    history: [],
    ...patch,
  };
}

test("an unfinished task past its deadline is overdue", () => {
  expect(taskAttention(task({ deadline: "2026-10-27", status: "In progress" }), NOW)).toBe("overdue");
});

test("an in-progress task that isn't overdue has a new status", () => {
  expect(taskAttention(task({ status: "In progress" }), NOW)).toBe("new-status");
});

test("done and not-started tasks need no attention", () => {
  expect(taskAttention(task({ status: "Done", deadline: "2026-10-01" }), NOW)).toBeUndefined();
  expect(taskAttention(task({}), NOW)).toBeUndefined();
});

test("a curated summary wins over the generated one", () => {
  expect(summarizeTask(task({ statusSummary: "Custom." }), NOW)).toBe("Custom.");
});

test("generated summaries name the owner and say where it stands", () => {
  expect(summarizeTask(task({ deadline: "2026-10-27", status: "In progress" }), NOW)).toMatch(/Maya Chen/);
  expect(summarizeTask(task({ deadline: "2026-10-27", status: "In progress" }), NOW)).toMatch(/past due/i);
  expect(summarizeTask(task({ status: "Done" }), NOW)).toMatch(/done/i);
  expect(summarizeTask(task({}), NOW)).toMatch(/Nov 10/);
});

test("an in-progress summary quotes the owner's latest reply", () => {
  const summary = summarizeTask(
    task({
      status: "In progress",
      history: [
        {
          kind: "message",
          id: "m1",
          channel: "email",
          authorRole: "delegate",
          authorName: "Maya Chen",
          sentAt: "2026-10-29T15:00:00Z",
          body: "Halfway through the vendor list.",
        },
      ],
    }),
    NOW,
  );
  expect(summary).toContain("Halfway through the vendor list.");
});

describe("taskDisplayStatus", () => {
  const base = task({});
  const blocker = { ...base, id: "first", status: "In progress" as const };
  const waiting = { ...base, id: "second", status: "In progress" as const, waitingOn: "first" };

  test("a task waiting on your review needs your review", () => {
    expect(taskDisplayStatus({ ...base, status: "In progress", awaitingReview: true }, [])).toEqual({
      label: "Needs your review",
    });
  });

  test("a task waiting on an unfinished task is blocked, by that task's owner or by you", () => {
    expect(taskDisplayStatus(waiting, [blocker, waiting])).toEqual({
      label: "Blocked",
      blockedBy: blocker.delegate.label,
    });
    const reviewing = { ...blocker, awaitingReview: true };
    expect(taskDisplayStatus(waiting, [reviewing, waiting])).toEqual({ label: "Blocked", blockedBy: "you" });
  });

  test("once the task it waits on is done, it shows its own status", () => {
    expect(taskDisplayStatus(waiting, [{ ...blocker, status: "Done" }, waiting])).toEqual({ label: "In progress" });
  });

  test("done, in progress and not started show as they are", () => {
    for (const status of ["Done", "In progress", "Not started"] as const) {
      expect(taskDisplayStatus({ ...base, status }, [])).toEqual({ label: status });
    }
  });
});

describe("orderedTasks", () => {
  test("numbers tasks in deadline order, keeping plan order for ties", () => {
    const tasks = [
      task({ id: "c", deadline: "2026-12-01" }),
      task({ id: "a", deadline: "2026-11-01" }),
      task({ id: "b1", deadline: "2026-11-15" }),
      task({ id: "b2", deadline: "2026-11-15" }),
    ];
    expect(orderedTasks(tasks).map((t) => t.id)).toEqual(["a", "b1", "b2", "c"]);
  });
});
