import { formatShortDate, orderedTasks } from "./taskStatus";
import type { Workstream, WorkstreamDraft } from "./workstream";
import { useWorkstreamStore } from "./workstreamStore";

const START_PHRASE = /^(please\s+)?(start|accept|go ahead|begin|kick (it )?off|let'?s (go|start|begin)|looks good)\b/i;
const START_ANYWHERE = /\b(accept (the )?plan|start (the )?workstream)\b/i;

/** A chat message asking Cowork to accept the plan and start: "Start", "Looks good, go ahead". Questions don't count. */
export function asksToStart(text: string): boolean {
  const message = text.trim();
  if (message.endsWith("?")) return false;
  return START_PHRASE.test(message) || START_ANYWHERE.test(message);
}

/**
 * Accept the plan and start the workstream. Cowork emails every owner their
 * task as it's created, and its chat reply says so, task by task, so it's
 * clear what starts happening the moment you start.
 */
export function startWorkstream(draft: WorkstreamDraft): { workstream: Workstream; reply: string } {
  const workstream = useWorkstreamStore
    .getState()
    .createWorkstream({ ...draft, plan: { ...draft.plan, status: "accepted" } });
  const lines = orderedTasks(workstream.plan.tasks).map(
    (task, i) => `${i + 1}. ${task.description}: ${task.delegate.label}, due ${formatShortDate(task.deadline)}`,
  );
  const reply = [
    "Started. I'm emailing each owner their task now.",
    lines.join("\n"),
    "Each email says what done looks like and when it's due. I'll follow up until each task is done, and tell you here when something needs you. Ask me here to change the plan, or about any task by its number.",
  ].join("\n\n");
  return { workstream, reply };
}
