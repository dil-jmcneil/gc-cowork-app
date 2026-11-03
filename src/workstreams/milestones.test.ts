import { draftWorkstreamFromInsight } from "@/workstreams/workstreamDraft";
import { ATG_RULING } from "@/insights/insights";

import { currentMilestone, milestoneStatuses } from "./milestones";

const draft = draftWorkstreamFromInsight(ATG_RULING);
const { milestones, tasks } = draft.plan;

test("a new plan's first milestone is current and the rest are upcoming", () => {
  expect(milestoneStatuses(milestones, tasks)).toEqual({
    assess: "Current",
    prepare: "Upcoming",
    adopt: "Upcoming",
    watch: "Upcoming",
  });
});

test("finishing a milestone's tasks makes the next one current", () => {
  const done = tasks.map((t) => (t.milestoneId === "assess" ? { ...t, status: "Done" as const } : t));
  expect(milestoneStatuses(milestones, done)).toMatchObject({
    assess: "Done",
    prepare: "Current",
  });
  expect(currentMilestone(milestones, done)?.id).toBe("prepare");
});

test("early work on a later milestone doesn't move the spine", () => {
  const early = tasks.map((t) => (t.milestoneId === "prepare" ? { ...t, status: "Done" as const } : t));
  expect(milestoneStatuses(milestones, early)).toMatchObject({
    assess: "Current",
    prepare: "Done",
    adopt: "Upcoming",
  });
});
