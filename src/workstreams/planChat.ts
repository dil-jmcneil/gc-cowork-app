import { LOGGED_IN_USER } from "@/user";

import { orderedTasks } from "./taskStatus";
import type { WorkstreamPlan, WorkstreamTask } from "./workstream";

const NUMBER_WORDS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };
const REMOVE = /\b(remove|drop|delete|cut|take out)\b/i;
const CLOSING = /\b(clos(e|ing)|final (step|approval|sign-?off))\b/i;

/** Task numbers mentioned in a message, in order: "task 4", "t3", "task three". Milestone is the old word for task. */
function taskNumbers(text: string): number[] {
  const found: number[] = [];
  for (const match of text.matchAll(/\b(?:task|milestone|t|m)\s*#?\s*(\d+|one|two|three|four|five|six)\b/gi)) {
    const raw = match[1].toLowerCase();
    found.push(NUMBER_WORDS[raw] ?? Number(raw));
  }
  // "...add the closing action to 3" names the target without the word "task".
  const trailing = text.match(/\b(?:to|into|onto)\s+(?:(?:task|milestone)\s*)?(\d+|one|two|three|four|five|six)\b/i);
  if (trailing) {
    const raw = trailing[1].toLowerCase();
    const n = NUMBER_WORDS[raw] ?? Number(raw);
    if (!found.includes(n) || found.length === 1) found.push(n);
  }
  return found;
}

const GC = LOGGED_IN_USER.firstName;

/** The GC's closing step at the end of a done-when line: "…, and Peter closes the signal." → "Peter closes the signal". */
function closingStep(doneWhen: string): string | undefined {
  return doneWhen.match(new RegExp(`(?:,? and |\\. |^)(${GC} [^.]+)\\.$`))?.[1];
}

/** "Peter closes the signal" → "closes the signal": the action, without whoever does it. */
function action(step: string): string {
  return step.startsWith(`${GC} `) ? step.slice(GC.length + 1) : step;
}

/** Adds a closing step to a done-when line, joining it to the GC's own step when it ends with one. */
function withClosingStep(doneWhen: string, step: string): string {
  const base = doneWhen.replace(/\.$/, "");
  return closingStep(doneWhen) ? `${base} and ${action(step)}.` : `${base}. ${step}.`;
}

export type PlanEdit = { plan: WorkstreamPlan; reply: string };

/**
 * Cowork's reply when the GC asks, in chat, to remove a task from the plan.
 * When the message mentions its closing step and names another task, that
 * task takes the step over. Tasks that waited on the removed one stop
 * waiting. Returns undefined for anything else, so the chat replies as usual.
 */
export function planEditFromChat(plan: WorkstreamPlan, text: string): PlanEdit | undefined {
  if (!REMOVE.test(text)) return undefined;
  const [removeNumber, targetNumber] = taskNumbers(text);
  if (!removeNumber) return undefined;

  // Numbers follow the order the plan shows its tasks in.
  const ordered = orderedTasks(plan.tasks);
  const removed = ordered[removeNumber - 1];
  if (!removed) {
    return { plan, reply: `The plan has ${plan.tasks.length} tasks, so there's no task ${removeNumber} to remove.` };
  }
  if (plan.tasks.length === 1) {
    return { plan, reply: "That's the only task, so I left it in. A plan needs at least one." };
  }

  const step = closingStep(removed.doneWhen);
  const wantsClosing = CLOSING.test(text);
  const target = targetNumber && targetNumber !== removeNumber ? ordered[targetNumber - 1] : undefined;

  const tasks: WorkstreamTask[] = plan.tasks
    .filter((t) => t.id !== removed.id)
    .map((t) => {
      let next = t;
      if (next.waitingOn === removed.id) {
        const { waitingOn: _gone, ...rest } = next;
        next = rest;
      }
      if (wantsClosing && step && target && t.id === target.id)
        next = { ...next, doneWhen: withClosingStep(t.doneWhen, step) };
      return next;
    });
  const next: WorkstreamPlan = {
    ...plan,
    tasks,
    proposedApproach: removed.approachPhrase
      ? plan.proposedApproach.replace(removed.approachPhrase, "")
      : plan.proposedApproach,
  };

  let reply = `I removed Task ${removeNumber}, ${removed.description}.`;
  if (!step) return { plan: next, reply };
  if (wantsClosing && target) {
    const updated = tasks.find((t) => t.id === target.id)!;
    reply += ` Task ${orderedTasks(tasks).indexOf(updated) + 1}, ${updated.description}, now ends with it: "${updated.doneWhen}"`;
  } else if (wantsClosing) {
    reply += ` Which task should take over its closing step, "${step}"?`;
  } else {
    reply += ` Its closing step, "${step}," went with it. Tell me which task should take it over.`;
  }
  return { plan: next, reply };
}
