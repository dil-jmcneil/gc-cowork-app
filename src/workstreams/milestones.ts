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
