import { signalType, type SignalType } from "@/signals/signal";
import { SIGNALS } from "@/signals/signals";
import { workstreamAttention } from "@/workstreams/workstreamAttention";
import { isTaskOverdue, taskActivity } from "@/workstreams/taskStatus";
import type { Workstream, WorkstreamTask } from "@/workstreams/workstream";

import type { AttentionItem } from "./attentionItems";

export type AttentionRowStatus = {
  label: "Overdue" | "Needs your review" | "No reply" | "New" | "On track";
  color: "error" | "warning" | "information";
};

export type AttentionRowAction =
  | { kind: "create"; label: string; href: string }
  | { kind: "review"; label: "Review"; href: string }
  | { kind: "nudge"; label: "Nudge"; workstreamId: string; taskId: string }
  | { kind: "view"; label: "View workstream"; href: string };

/** One row of the attention table: a new signal, or a task that needs you to move it. */
export type AttentionRow = {
  /** The signal id, or `workstreamId:taskId` for a task. Snooze and dismiss key on it. */
  id: string;
  title: string;
  summary: string;
  /** Where it comes from: who issued a signal and its type, or a task's workstream. */
  source: { name: string; kind: SignalType | "Workstream" };
  /** A task's owner, e.g. for the nudge confirmation. */
  owner?: string;
  status: AttentionRowStatus;
  action: AttentionRowAction;
  /** Why Cowork surfaced a signal, for its info tooltip. */
  whySurfaced?: string;
  /** ISO date that orders rows of the same status. */
  due: string;
};

const RANK: Record<AttentionRowStatus["label"], number> = {
  Overdue: 0,
  "Needs your review": 1,
  "No reply": 2,
  New: 3,
  "On track": 4,
};

/** A new signal's button opens it, named for what it is. */
const VIEW_LABEL: Record<SignalType, string> = {
  "Court ruling": "View ruling",
  "Regulatory change": "View rule",
  "Enforcement action": "View action",
  "Peer filing": "View filing",
};

const workstreamHref = (w: Workstream, task?: WorkstreamTask) =>
  `/workstreams/${w.id}${task ? `?task=${encodeURIComponent(task.id)}` : ""}`;

function taskRows(workstream: Workstream, now: Date): AttentionRow[] {
  const { waitingOnYou, waitingOnOthers } = workstreamAttention(workstream, now);
  const base = (task: WorkstreamTask) => ({
    id: `${workstream.id}:${task.id}`,
    title: task.description,
    source: { name: workstream.name, kind: "Workstream" } as const,
    owner: task.delegate.label,
    due: task.deadline,
  });
  return [
    ...waitingOnYou.map(({ task }) => ({
      ...base(task),
      summary: task.reviewPrompt ?? task.statusSummary ?? taskActivity(task, now),
      status: { label: "Needs your review", color: "warning" } as const,
      action: { kind: "review", label: "Review", href: workstreamHref(workstream, task) } as const,
    })),
    ...waitingOnOthers.map(({ task }) => ({
      ...base(task),
      summary: task.statusSummary ?? taskActivity(task, now),
      status: isTaskOverdue(task, now)
        ? ({ label: "Overdue", color: "error" } as const)
        : ({ label: "No reply", color: "warning" } as const),
      action: { kind: "nudge", label: "Nudge", workstreamId: workstream.id, taskId: task.id } as const,
    })),
  ];
}

/**
 * What the GC needs to move, in one list: new signals to turn into
 * workstreams, and tasks in any workstream that wait on them. A signal with a
 * workstream gives way to that workstream's tasks; if none need the GC, one
 * row stays to view it. Overdue work comes first, then reviews, then new
 * signals, each by date.
 */
export function attentionRows(signalItems: AttentionItem[], workstreams: Workstream[], now: Date): AttentionRow[] {
  const rows: AttentionRow[] = [];

  for (const item of signalItems) {
    const signal = SIGNALS.find((s) => s.id === item.id);
    const workstream = workstreams.find((w) => w.sourceSignalId === item.id);
    if (!workstream) {
      rows.push({
        id: item.id,
        title: item.title,
        summary: signal?.plan?.brief.headline ?? item.summary,
        source: { name: signal?.source ?? item.source, kind: signal ? signalType(signal) : (item.source as SignalType) },
        status: { label: "New", color: "information" },
        action: { kind: "create", label: VIEW_LABEL[signal ? signalType(signal) : (item.source as SignalType)], href: `/workstreams/new?signal=${encodeURIComponent(item.id)}` },
        whySurfaced: item.whySurfaced,
        due: signal?.deadlines[0]?.date ?? "9999-12-31",
      });
      continue;
    }
    const allDone = workstream.plan.tasks.every((t) => t.status === "Done");
    if (!allDone && !taskRows(workstream, now).length) {
      const next = workstream.plan.tasks.filter((t) => t.status !== "Done").sort((a, b) => a.deadline.localeCompare(b.deadline))[0];
      rows.push({
        id: item.id,
        title: workstream.name,
        summary: workstreamAttention(workstream, now).summary.headline,
        source: { name: workstream.name, kind: "Workstream" },
        owner: next.delegate.label,
        status: { label: "On track", color: "information" },
        action: { kind: "view", label: "View workstream", href: workstreamHref(workstream) },
        due: next.deadline,
      });
    }
  }

  for (const workstream of workstreams) rows.push(...taskRows(workstream, now));

  return rows.sort((a, b) => RANK[a.status.label] - RANK[b.status.label] || a.due.localeCompare(b.due));
}
