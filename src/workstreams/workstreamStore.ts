import { create } from "zustand";

import { SIGNALS } from "@/signals/signals";

import { isAtgWorkstream, progressAtgWorkstream } from "./atgStory";
import type { TaskOwner } from "./people";
import type { Workstream, WorkstreamDraft, WorkstreamTask, TaskStatus, WorkstreamPlan } from "./workstream";
import { summarizeWorkstream } from "./workstreamDraft";
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

/** Workstreams that already exist when the app loads. The demo starts with none. */
export const SEED_WORKSTREAMS: Workstream[] = [];

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
  /** Apply `update` to one task, then refresh the workstream's summary. */
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
        statusSummary: summarizeWorkstream(draft),
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
          const plan = { ...p.plan, status: "accepted" as const };
          return { ...p, plan, statusSummary: summarizeWorkstream({ plan }) };
        }),
      })),

    assignTask: (workstreamId, taskId, owner) =>
      updateTask(workstreamId, taskId, (task) =>
        append({ ...task, delegate: owner, statusSummary: undefined }, reassignmentEmail(task, owner, nowIso())),
      ),

    setTaskStatus: (workstreamId, taskId, status) => {
      updateTask(workstreamId, taskId, (task) =>
        append(
          // Marking it done yourself also settles any review you were asked for.
          { ...task, status, statusSummary: undefined, ...(status === "Done" ? { awaitingReview: false } : {}) },
          statusChangeNote(status, nowIso()),
        ),
      );
      set((state) => ({
        workstreams: state.workstreams.map((p) =>
          p.id === workstreamId ? { ...p, statusSummary: summarizeWorkstream(p) } : p,
        ),
      }));
    },

    confirmTaskDone: (workstreamId, taskId) => {
      updateTask(workstreamId, taskId, (task) =>
        append(
          { ...task, status: "Done", awaitingReview: false, statusSummary: undefined },
          confirmedDoneNote(nowIso()),
        ),
      );
      set((state) => ({
        workstreams: state.workstreams.map((p) =>
          p.id === workstreamId ? { ...p, statusSummary: summarizeWorkstream(p) } : p,
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
