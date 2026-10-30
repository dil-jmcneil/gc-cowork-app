import type { ProjectTask } from "@/projects/project";
import { DIRECTORY } from "@/projects/people";
import { summarizeTask, taskAttention } from "@/projects/taskStatus";

const NOW = new Date("2026-10-30T12:00:00Z");
const MAYA = DIRECTORY.find((p) => p.label === "Maya Chen")!;

function task(patch: Partial<ProjectTask>): ProjectTask {
  return {
    id: "t",
    description: "Review the tools",
    delegator: "Peter",
    delegate: MAYA,
    ccs: [],
    deadline: "2026-11-10",
    status: "Not started",
    thread: [],
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
      thread: [
        {
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
