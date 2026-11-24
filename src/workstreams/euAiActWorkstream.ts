import { EU_AI_ACT } from "@/signals/euAiAct";
import { ATG_RULING } from "@/signals/signals";
import { LOGGED_IN_USER } from "@/user";

import { ownerFromEntry } from "./people";
import { assignmentEmail, ownerReply } from "./threadMessages";
import type { Workstream, WorkstreamTask } from "./workstream";

/** Plan-wide rules that fit any workstream, borrowed from the ATG plan. */
const SHARED_RULE_IDS = ["follow-up", "more-time", "wrong-owner", "stuck"];

const STARTED_AT = "2026-11-18T15:00:00.000Z";
const CHRIS_REPLIED_AT = "2026-11-23T16:20:00.000Z";

/** Where each task stands on the day the demo opens. */
const PROGRESS: Record<string, Partial<WorkstreamTask>> = {
  provider: {
    status: "In progress",
    awaitingReview: true,
    reviewPrompt: "Review Chris's answer: Acme built the AI assistant, so the marking is Acme's job.",
    statusSummary: "Chris replied Nov 23: Acme built the assistant in-house on a licensed model.",
  },
  marking: { statusSummary: "Chris starts once you confirm who the provider is." },
  detect: { statusSummary: "Sam starts once the marking is in." },
};

const CHRIS_REPLY =
  "Acme built the assistant in-house. We license the underlying model, but our team built the product and ships it under our name, so we'd count as the provider. Happy to start on the marking once you confirm.";

/**
 * The EU AI Act workstream, already under way when the app loads, so the
 * attention pane shows a started workstream's tasks next to a new signal.
 */
function euAiActWorkstream(): Workstream {
  const plan = EU_AI_ACT.plan!;
  const tasks: WorkstreamTask[] = plan.tasks.map((t) => {
    const owner = ownerFromEntry({ name: "", email: t.ownerEmail });
    const task: WorkstreamTask = {
      id: t.id,
      description: t.description,
      doneWhen: t.doneWhen,
      ...(t.waitingOn ? { waitingOn: t.waitingOn } : {}),
      delegator: LOGGED_IN_USER.firstName,
      delegate: owner,
      ccs: t.ccEmails.map((email) => ownerFromEntry({ name: "", email })),
      deadline: t.due,
      status: "Not started",
      history: [],
      ...PROGRESS[t.id],
    };
    const history = [assignmentEmail(task, STARTED_AT)];
    if (t.id === "provider") history.push(ownerReply(owner, CHRIS_REPLY, CHRIS_REPLIED_AT));
    return { ...task, history };
  });

  return {
    id: "eu-ai-act-marking",
    name: "EU AI marking readiness",
    sourceSignalId: EU_AI_ACT.id,
    description: EU_AI_ACT.summary,
    reasonsRelevant: EU_AI_ACT.reasonsRelevant,
    createdAt: STARTED_AT,
    plan: {
      proposedApproach: plan.approach,
      status: "accepted",
      rules: ATG_RULING.plan!.rules.filter((r) => SHARED_RULE_IDS.includes(r.id)),
      tasks,
    },
  };
}

export const EU_AI_ACT_WORKSTREAM: Workstream = euAiActWorkstream();
