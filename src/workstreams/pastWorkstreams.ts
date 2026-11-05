import type { PastWorkstream, Signal } from "@/signals/signal";
import { ATG_RULING, PAST_SIGNALS } from "@/signals/signals";
import { LOGGED_IN_USER } from "@/user";

import { DIRECTORY } from "./people";
import { assignmentEmail } from "./threadMessages";
import type { Workstream, WorkstreamTask } from "./workstream";

/** Plan-wide rules that fit any workstream, borrowed from the ATG plan. */
const SHARED_RULE_IDS = ["follow-up", "more-time", "wrong-owner", "stuck"];

function ownerNamed(name: string) {
  const owner = DIRECTORY.find((p) => p.label === name);
  if (!owner) throw new Error(`No directory person named ${name}`);
  return owner;
}

/** A past workstream from the signal data, as a real workstream with a page and calendar tasks. */
function fromPastSignal(signal: Signal, past: PastWorkstream): Workstream {
  const createdAt = `${past.startedOn}T14:00:00.000Z`;
  const tasks: WorkstreamTask[] = past.tasks.map((t) => {
    const task: WorkstreamTask = {
      id: t.id,
      description: t.description,
      doneWhen: t.doneWhen,
      ...(t.waitingOn ? { waitingOn: t.waitingOn } : {}),
      delegator: LOGGED_IN_USER.firstName,
      delegate: ownerNamed(t.owner),
      ccs: [],
      deadline: t.due,
      status: t.status,
      statusSummary: t.statusSummary,
      history: [],
    };
    return { ...task, history: [assignmentEmail(task, createdAt)] };
  });
  return {
    id: `past-${past.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    name: past.name,
    sourceSignalId: signal.id,
    description: signal.summary,
    reasonsRelevant: signal.reasonsRelevant,
    createdAt,
    plan: {
      proposedApproach:
        "Cowork tracks each task with its owner, follows up when one slips, and tells you when a milestone is ready to hand over.",
      status: "accepted",
      rules: ATG_RULING.plan!.rules.filter((r) => SHARED_RULE_IDS.includes(r.id)),
      tasks,
    },
  };
}

/** Workstreams from before the ATG story: Climate disclosure readiness and Cyber 8-K readiness. */
export const PAST_WORKSTREAMS: Workstream[] = PAST_SIGNALS.flatMap((signal) =>
  signal.pastWorkstream ? [fromPastSignal(signal, signal.pastWorkstream)] : [],
);
