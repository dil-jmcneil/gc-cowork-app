import type { PlannedSignal } from "@/signals/signal";
import { LOGGED_IN_USER } from "@/user";

import { findPerson, UNASSIGNED_OWNER } from "./people";
import type { WorkstreamDraft, WorkstreamTask } from "./workstream";

/**
 * Mocked "AI" draft: name, description, and the signal's plan, with one task per template.
 * `owners: "unassigned"` leaves every task without an owner: Cowork doesn't know
 * who should own what, so the GC adds owners in chat (the Create page does this).
 */
export function draftWorkstreamFromSignal(
  signal: PlannedSignal,
  { owners = "suggested" }: { owners?: "suggested" | "unassigned" } = {},
): WorkstreamDraft {
  const { approach, tasks: templates, rules } = signal.plan;
  const taskId = (templateId: string) => `${signal.id}-${templateId}`;

  const tasks: WorkstreamTask[] = templates.map((template) => ({
    id: taskId(template.id),
    description: template.description,
    doneWhen: template.doneWhen,
    ...(template.waitingOn ? { waitingOn: taskId(template.waitingOn) } : {}),
    ...(template.approachPhrase ? { approachPhrase: template.approachPhrase } : {}),
    delegator: LOGGED_IN_USER.firstName,
    delegate: owners === "unassigned" ? UNASSIGNED_OWNER : findPerson(template.ownerEmail),
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
