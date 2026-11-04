import type { Milestone, WorkstreamTask } from "./workstream";

export type MilestoneStatus = "Done" | "Current" | "Upcoming";

/**
 * Where each milestone stands. The plan is a spine: the first milestone with
 * open tasks is current. Later milestones stay upcoming even if early work on
 * their tasks has started, because their gate hasn't been reached.
 */
export function milestoneStatuses(milestones: Milestone[], tasks: WorkstreamTask[]): Record<string, MilestoneStatus> {
  const statuses: Record<string, MilestoneStatus> = {};
  let currentFound = false;
  for (const milestone of milestones) {
    const own = tasks.filter((t) => t.milestoneId === milestone.id);
    if (own.length > 0 && own.every((t) => t.status === "Done")) {
      statuses[milestone.id] = "Done";
    } else if (!currentFound) {
      statuses[milestone.id] = "Current";
      currentFound = true;
    } else {
      statuses[milestone.id] = "Upcoming";
    }
  }
  return statuses;
}

export function currentMilestone(milestones: Milestone[], tasks: WorkstreamTask[]): Milestone | undefined {
  const statuses = milestoneStatuses(milestones, tasks);
  return milestones.find((m) => statuses[m.id] === "Current");
}

/** How a milestone reads in the simplified plan: its status, who owns the open work, and whether it needs you. */
export type MilestoneProgress = {
  status: "Done" | "In progress" | "Blocked" | "Not started";
  /** The open tasks' owners (all owners once it's done): "Alex Kim", or "Pete Lin +1". */
  owner: string;
  /** A task waits on your review. */
  needsYou: boolean;
  /** "you", or the owner of an overdue task. */
  blockedBy?: string;
};

function ownerLabel(tasks: WorkstreamTask[]): string {
  const owners = [...new Set(tasks.map((t) => t.delegate.label))];
  if (owners.length <= 1) return owners[0] ?? "No owner";
  return `${owners[0]} +${owners.length - 1}`;
}

/**
 * A milestone is done when every task is; blocked when a task waits on your
 * review (blocked by you) or is overdue (blocked by its owner); in progress
 * once any task has moved; otherwise not started.
 */
export function milestoneProgress(milestone: Milestone, tasks: WorkstreamTask[], now: Date): MilestoneProgress {
  const own = tasks.filter((t) => t.milestoneId === milestone.id);
  const open = own.filter((t) => t.status !== "Done").sort((a, b) => a.deadline.localeCompare(b.deadline));
  if (own.length > 0 && open.length === 0) return { status: "Done", owner: ownerLabel(own), needsYou: false };

  const owner = ownerLabel(open);
  if (open.some((t) => t.awaitingReview)) {
    return {
      status: "Blocked",
      owner: ownerLabel(open.filter((t) => t.awaitingReview)),
      needsYou: true,
      blockedBy: "you",
    };
  }
  const late = open.find((t) => t.status !== "Done" && new Date(`${t.deadline}T00:00:00Z`) < now);
  if (late) return { status: "Blocked", owner, needsYou: false, blockedBy: late.delegate.label };
  if (own.some((t) => t.status !== "Not started")) return { status: "In progress", owner, needsYou: false };
  return { status: "Not started", owner, needsYou: false };
}
