import type { PlannedSignal } from "@/signals/signal";
import { LOGGED_IN_USER } from "@/user";

import { findPerson } from "./people";
import type { WorkstreamDraft, WorkstreamTask } from "./workstream";

/** Mocked "AI" draft: name, description, and the signal's plan, with one task per template. */
export function draftWorkstreamFromSignal(signal: PlannedSignal): WorkstreamDraft {
  const { approach, tasks: templates, rules } = signal.plan;
  const taskId = (templateId: string) => `${signal.id}-${templateId}`;

  const tasks: WorkstreamTask[] = templates.map((template) => ({
    id: taskId(template.id),
    description: template.description,
    doneWhen: template.doneWhen,
    ...(template.waitingOn ? { waitingOn: taskId(template.waitingOn) } : {}),
    ...(template.approachPhrase ? { approachPhrase: template.approachPhrase } : {}),
    delegator: LOGGED_IN_USER.firstName,
    delegate: findPerson(template.ownerEmail),
    ccs: template.ccEmails.map(findPerson),
    deadline: template.due,
    status: "Not started",
    history: [],
  }));

  return {
    name: signal.title,
    sourceSignalId: signal.id,
    description: signal.summary,
    reasonsRelevant: [...signal.reasonsRelevant],
    plan: { proposedApproach: approach, status: "draft", rules, tasks },
  };
}
