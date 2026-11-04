import { create } from "zustand";

import { SIGNALS } from "@/signals/signals";

import { afterAtgTaskConfirmed, isAtgWorkstream, progressAtgWorkstream } from "./atgStory";
import { PAST_WORKSTREAMS } from "./pastWorkstreams";
import { ownerShortName, type TaskOwner } from "./people";
import { formatShortDate } from "./taskStatus";
import type { Workstream, WorkstreamDraft, WorkstreamTask, TaskStatus, WorkstreamPlan } from "./workstream";
import type { HistoryEntry } from "./thread";
import {
  assignmentEmail,
  gcChatMessage,
  messageEmail,
  reassignmentEmail,
  relayEmail,
  reminderEmail,
  confirmedDoneNote,
  statusChangeNote,
} from "./threadMessages";

function makeId() {
  return `workstream-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Workstreams that already exist when the app loads: the two from before the ATG story. */
export const SEED_WORKSTREAMS: Workstream[] = PAST_WORKSTREAMS;

type WorkstreamStoreState = {
  workstreams: Workstream[];
  createWorkstream: (draft: WorkstreamDraft) => Workstream;
  getWorkstream: (id: string) => Workstream | undefined;
  getWorkstreamForSignal: (signalId: string) => Workstream | undefined;
  getTask: (workstreamId: string, taskId: string) => WorkstreamTask | undefined;
  acceptPlan: (id: string) => void;
  /** Replace a workstream's plan, e.g. after a revision in chat. */
  updatePlan: (id: string, plan: WorkstreamPlan) => void;
  assignTask: (workstreamId: string, taskId: string, owner: TaskOwner) => void;
  setTaskStatus: (workstreamId: string, taskId: string, status: TaskStatus) => void;
  /** The GC confirms an owner's "done": the task closes. */
  confirmTaskDone: (workstreamId: string, taskId: string) => void;
  nudgeTask: (workstreamId: string, taskId: string) => void;
  messageDelegate: (workstreamId: string, taskId: string, text: string) => void;
  addChatNote: (workstreamId: string, taskId: string, text: string) => void;
};

const nowIso = () => new Date().toISOString();

export const useWorkstreamStore = create<WorkstreamStoreState>((set, get) => {
  /** Apply `update` to one task. The workstream's summary is derived from its tasks (`workstreamAttention`). */
  const updateTask = (workstreamId: string, taskId: string, update: (task: WorkstreamTask) => WorkstreamTask) =>
    set((state) => ({
      workstreams: state.workstreams.map((p) => {
        if (p.id !== workstreamId) return p;
        const plan = {
          ...p.plan,
          tasks: p.plan.tasks.map((t) => (t.id === taskId ? update(t) : t)),
        };
        return { ...p, plan };
      }),
    }));

  const append = (task: WorkstreamTask, ...entries: HistoryEntry[]): WorkstreamTask => ({
    ...task,
    history: [...task.history, ...entries],
  });

  return {
    workstreams: [...SEED_WORKSTREAMS],

    createWorkstream: (draft) => {
      const fallbackName = SIGNALS.find((c) => c.id === draft.sourceSignalId)?.title ?? "Untitled workstream";
      const createdAt = nowIso();
      const base: Workstream = {
        ...draft,
        name: draft.name.trim() || fallbackName,
        id: makeId(),
        createdAt,
        plan: {
          ...draft.plan,
          tasks: draft.plan.tasks.map((t) => ({
            ...t,
            history: [assignmentEmail(t, createdAt)],
          })),
        },
      };
      const workstream = isAtgWorkstream(base) ? progressAtgWorkstream(base) : base;
      set((state) => ({ workstreams: [workstream, ...state.workstreams] }));
      return workstream;
    },

    getWorkstream: (id) => get().workstreams.find((p) => p.id === id),

    getWorkstreamForSignal: (signalId) => get().workstreams.find((p) => p.sourceSignalId === signalId),

    getTask: (workstreamId, taskId) =>
      get()
        .workstreams.find((p) => p.id === workstreamId)
        ?.plan.tasks.find((t) => t.id === taskId),

    updatePlan: (id, plan) =>
      set((state) => ({ workstreams: state.workstreams.map((w) => (w.id === id ? { ...w, plan } : w)) })),

    acceptPlan: (id) =>
      set((state) => ({
        workstreams: state.workstreams.map((p) => {
          if (p.id !== id) return p;
          return { ...p, plan: { ...p.plan, status: "accepted" as const } };
        }),
      })),

    assignTask: (workstreamId, taskId, owner) => {
      const sentAt = nowIso();
      updateTask(workstreamId, taskId, (task) =>
        append(
          {
            ...task,
            delegate: owner,
            // About the new owner: the old one's last reply no longer says where it stands.
            statusSummary: `Reassigned to ${owner.label} on ${formatShortDate(sentAt)}. Waiting on ${ownerShortName(owner)}'s reply.`,
          },
          reassignmentEmail(task, owner, sentAt),
        ),
      );
    },

    setTaskStatus: (workstreamId, taskId, status) => {
      updateTask(workstreamId, taskId, (task) =>
        append(
          // Marking it done yourself also settles any review you were asked for.
          { ...task, status, statusSummary: undefined, ...(status === "Done" ? { awaitingReview: false } : {}) },
          statusChangeNote(status, nowIso()),
        ),
      );
    },

    confirmTaskDone: (workstreamId, taskId) => {
      // Only a task waiting on your review can be confirmed, so a second click changes nothing.
      if (!get().getTask(workstreamId, taskId)?.awaitingReview) return;
      const sentAt = nowIso();
      updateTask(workstreamId, taskId, (task) =>
        append(
          {
            ...task,
            status: "Done",
            awaitingReview: false,
            statusSummary: `You confirmed ${ownerShortName(task.delegate)}'s work on ${formatShortDate(sentAt)}.`,
          },
          confirmedDoneNote(sentAt),
        ),
      );
      set((state) => ({
        workstreams: state.workstreams.map((w) =>
          w.id === workstreamId ? afterAtgTaskConfirmed(w, taskId, sentAt) : w,
        ),
      }));
    },

    nudgeTask: (workstreamId, taskId) =>
      updateTask(workstreamId, taskId, (task) =>
        append({ ...task, statusSummary: undefined }, reminderEmail(task, nowIso())),
      ),

    messageDelegate: (workstreamId, taskId, text) =>
      updateTask(workstreamId, taskId, (task) => append(task, messageEmail(task, text, nowIso()))),

    addChatNote: (workstreamId, taskId, text) => {
      const sentAt = nowIso();
      updateTask(workstreamId, taskId, (task) =>
        append(task, gcChatMessage(text, sentAt), relayEmail(task, text, sentAt)),
      );
    },
  };
});
