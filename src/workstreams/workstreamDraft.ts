import type { PlannedSignal } from "@/signals/signal";
import { LOGGED_IN_USER } from "@/user";

import { findPerson } from "./people";
import type { WorkstreamDraft, WorkstreamTask } from "./workstream";

const ASSOCIATE_GC = "pete.lin@acme.com";
const CORPORATE_SECRETARY = "alex.kim@acme.com";

/** The associate GC stays informed on every task, unless they own it. */
function defaultCcs(ownerEmail: string) {
  return [findPerson(ownerEmail === ASSOCIATE_GC ? CORPORATE_SECRETARY : ASSOCIATE_GC)];
}

/** Mocked "AI" draft: name, description, and the signal's plan, with one task per template. */
export function draftWorkstreamFromSignal(signal: PlannedSignal): WorkstreamDraft {
  const { approach, milestones, rules } = signal.plan;

  const tasks: WorkstreamTask[] = milestones.flatMap((milestone) =>
    milestone.tasks.map((template) => ({
      id: `${signal.id}-${template.id}`,
      milestoneId: milestone.id,
      description: template.description,
      delegator: LOGGED_IN_USER.firstName,
      delegate: findPerson(template.ownerEmail),
      ccs: defaultCcs(template.ownerEmail),
      deadline: template.due,
      status: "Not started",
      history: [],
    })),
  );

  return {
    name: signal.title,
    sourceSignalId: signal.id,
    description: signal.summary,
    reasonsRelevant: [...signal.reasonsRelevant],
    plan: {
      proposedApproach: approach,
      status: "draft",
      milestones: milestones.map(({ tasks: _tasks, ...milestone }) => milestone),
      rules,
      tasks,
    },
  };
}
