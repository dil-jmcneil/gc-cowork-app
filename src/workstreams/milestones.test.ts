import { draftWorkstreamFromSignal } from "@/workstreams/workstreamDraft";
import { ATG_RULING } from "@/signals/signals";

import { currentMilestone, milestoneProgress, milestoneStatuses } from "./milestones";
import { PAST_WORKSTREAMS } from "./pastWorkstreams";
import { SEED_WORKSTREAMS, useWorkstreamStore } from "./workstreamStore";

const draft = draftWorkstreamFromSignal(ATG_RULING);
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

describe("milestoneProgress", () => {
  const NOW = new Date("2026-11-03T12:00:00Z");

  function atgPlan() {
    useWorkstreamStore.setState({ workstreams: [...SEED_WORKSTREAMS] });
    const draft = draftWorkstreamFromSignal(ATG_RULING);
    return useWorkstreamStore.getState().createWorkstream({ ...draft, plan: { ...draft.plan, status: "accepted" } })
      .plan;
  }
  const progressOf = (plan: ReturnType<typeof atgPlan>, id: string) =>
    milestoneProgress(
      plan.milestones.find((m) => m.id === id)!,
      plan.tasks,
      NOW,
    );

  test("Milestone 1 is blocked by you: Dana's memo waits on your review", () => {
    expect(progressOf(atgPlan(), "assess")).toMatchObject({
      status: "Blocked",
      needsYou: true,
      blockedBy: "you",
      owner: "Dana Whitfield",
    });
  });

  test("Milestone 2 is in progress: the agenda is done, the questionnaire isn't", () => {
    expect(progressOf(atgPlan(), "prepare")).toMatchObject({
      status: "In progress",
      needsYou: false,
      owner: "Alex Kim",
    });
  });

  test("Milestone 3 hasn't started, and lists the soonest owner plus a count", () => {
    expect(progressOf(atgPlan(), "adopt")).toMatchObject({ status: "Not started", owner: "Morgan Diaz +1" });
  });

  test("an overdue task blocks its milestone on its owner", () => {
    const climate = PAST_WORKSTREAMS.find((w) => w.name === "Climate disclosure readiness")!.plan;
    expect(
      milestoneProgress(
        climate.milestones.find((m) => m.id === "climate-assure-brief")!,
        climate.tasks,
        NOW,
      ),
    ).toMatchObject({ status: "Blocked", blockedBy: "Maya Chen", needsYou: false });
  });

  test("a milestone whose tasks are all done is done, once you clear the memo", () => {
    const plan = atgPlan();
    const done = {
      ...plan,
      tasks: plan.tasks.map((t) =>
        t.milestoneId === "assess" ? { ...t, status: "Done" as const, awaitingReview: false } : t,
      ),
    };
    expect(progressOf(done, "assess")).toMatchObject({ status: "Done", needsYou: false, owner: "Dana Whitfield" });
  });
});
