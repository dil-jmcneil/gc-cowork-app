import { LOGGED_IN_USER } from "@/user";

import type { Milestone, WorkstreamPlan } from "./workstream";

const NUMBER_WORDS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };
const REMOVE = /\b(remove|drop|delete|cut|take out)\b/i;
const CLOSING = /\b(clos(e|ing)|final (step|approval|sign-?off))\b/i;

/** Milestone numbers mentioned in a message, in order: "milestone 4", "m3", "milestone three". */
function milestoneNumbers(text: string): number[] {
  const found: number[] = [];
  for (const match of text.matchAll(/\b(?:milestone|m)\s*#?\s*(\d+|one|two|three|four|five|six)\b/gi)) {
    const raw = match[1].toLowerCase();
    found.push(NUMBER_WORDS[raw] ?? Number(raw));
  }
  // "...add the closing action to 3" names the target without the word "milestone".
  const trailing = text.match(/\b(?:to|into|onto)\s+(?:milestone\s*)?(\d+|one|two|three|four|five|six)\b/i);
  if (trailing) {
    const raw = trailing[1].toLowerCase();
    const n = NUMBER_WORDS[raw] ?? Number(raw);
    if (!found.includes(n) || found.length === 1) found.push(n);
  }
  return found;
}

/** "Peter closes the signal" → "closes the signal": the action, without whoever does it. */
function action(approver: string): string {
  const name = `${LOGGED_IN_USER.firstName} `;
  return approver.startsWith(name) ? approver.slice(name.length) : approver;
}

function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

export type PlanEdit = { plan: WorkstreamPlan; reply: string };

/**
 * Cowork's reply when the GC asks, in chat, to remove a milestone from the
 * plan. The milestone's tasks go with it. When the message mentions its
 * closing action and names another milestone, that milestone takes over the
 * approval. Returns undefined for anything else, so the chat replies as usual.
 */
export function planEditFromChat(plan: WorkstreamPlan, text: string): PlanEdit | undefined {
  if (!REMOVE.test(text)) return undefined;
  const [removeNumber, targetNumber] = milestoneNumbers(text);
  if (!removeNumber) return undefined;

  const removed = plan.milestones[removeNumber - 1];
  if (!removed) {
    return {
      plan,
      reply: `The plan has ${plan.milestones.length} milestones, so there's no Milestone ${removeNumber} to remove.`,
    };
  }
  if (plan.milestones.length === 1) {
    return { plan, reply: "That's the only milestone, so I left it in. A plan needs at least one." };
  }

  const removedTasks = plan.tasks.filter((t) => t.milestoneId === removed.id);
  const wantsClosing = CLOSING.test(text);
  const target = targetNumber && targetNumber !== removeNumber ? plan.milestones[targetNumber - 1] : undefined;

  const milestones: Milestone[] = plan.milestones
    .filter((m) => m.id !== removed.id)
    .map((m) =>
      wantsClosing && target && m.id === target.id
        ? { ...m, approver: `${m.approver} and ${action(removed.approver)}` }
        : m,
    );
  const next: WorkstreamPlan = {
    ...plan,
    milestones,
    tasks: plan.tasks.filter((t) => t.milestoneId !== removed.id),
    proposedApproach: removed.approachPhrase
      ? plan.proposedApproach.replace(removed.approachPhrase, "")
      : plan.proposedApproach,
  };

  const taskNote = removedTasks.length
    ? ` and its ${removedTasks.length === 1 ? "task" : `${removedTasks.length} tasks`} (${removedTasks.map((t) => lowerFirst(t.description)).join("; ")})`
    : "";
  let reply = `I removed Milestone ${removeNumber}, ${removed.title},${taskNote}.`;
  if (wantsClosing && target) {
    const newNumber = milestones.findIndex((m) => m.id === target.id) + 1;
    reply += ` Milestone ${newNumber}, ${target.title}, now ends with the closing step: "${milestones[newNumber - 1].approver}."`;
  } else if (wantsClosing) {
    reply += ` Which milestone should take over its closing step, "${removed.approver}"?`;
  } else {
    reply += ` Its closing step, "${removed.approver}," went with it. Tell me which milestone should take it over.`;
  }
  return { plan: next, reply };
}
