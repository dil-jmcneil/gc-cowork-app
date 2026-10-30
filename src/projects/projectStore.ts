import { create } from "zustand";

import { REGULATORY_CHANGES } from "@/regulatory/regulatoryChanges";

import { isCyberProject, progressCyberProject } from "./cyberStory";
import type { TaskOwner } from "./people";
import type { Project, ProjectDraft, ProjectTask, TaskStatus } from "./project";
import { draftProjectFromChange, summarizeProject } from "./projectDraft";
import type { TaskMessage } from "./thread";
import {
  assignmentEmail,
  gcChatMessage,
  messageEmail,
  ownerReply,
  reassignmentEmail,
  relayEmail,
  reminderEmail,
  statusChangeNote,
} from "./threadMessages";

function makeId() {
  return `project-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const SEEDED_AT = "2026-10-12T14:00:00Z";

/** Seed a task's thread: Cowork's assignment email, then whatever came after. */
function seedThread(task: ProjectTask, after: (task: ProjectTask) => TaskMessage[] = () => []): ProjectTask {
  return { ...task, thread: [assignmentEmail(task, SEEDED_AT), ...after(task)] };
}

function seedProject(changeId: string, patch: (draft: ProjectDraft) => ProjectDraft, statusSummary: string): Project {
  const change = REGULATORY_CHANGES.find((c) => c.id === changeId)!;
  return {
    ...patch(draftProjectFromChange(change)),
    id: `project-${changeId}`,
    statusSummary,
    createdAt: SEEDED_AT,
  };
}

/** Mock projects that already exist when the app loads. */
export const SEED_PROJECTS: Project[] = [
  seedProject(
    "ftc-click-to-cancel",
    (draft) => ({
      ...draft,
      name: "Online cancellation update",
      plan: {
        ...draft.plan,
        status: "accepted",
        tasks: draft.plan.tasks.map((t, i) => {
          if (i === 0) {
            return seedThread({ ...t, status: "Done" }, (task) => [
              ownerReply(task.delegate, "Gap list attached. Three places still assume phone-only cancellation.", "2026-10-20T16:10:00Z", [
                "Cancellation gap list.xlsx",
              ]),
            ]);
          }
          if (i === 1) {
            return seedThread({ ...t, status: "In progress" }, (task) => [
              ownerReply(task.delegate, "Design is done. Engineering starts the build next sprint.", "2026-10-27T15:30:00Z"),
            ]);
          }
          return seedThread(t);
        }),
      },
    }),
    "On track. The policy gap review is done, and product is building the online cancel flow ahead of the Feb 15 deadline.",
  ),
  seedProject(
    "cppa-automated-decisions",
    (draft) => ({
      ...draft,
      name: "Automated hiring decisions",
      plan: {
        ...draft.plan,
        tasks: draft.plan.tasks.map((t, i) =>
          i === 0
            ? // The review slipped past its date, so the calendar shows it Blocked with a Nudge.
              seedThread({ ...t, status: "In progress", deadline: "2026-10-27" }, (task) => [
                ownerReply(task.delegate, "Starting with the screening vendor next week.", "2026-10-15T17:00:00Z"),
                reminderEmail(task, "2026-10-28T13:00:00Z"),
              ])
            : seedThread(t),
        ),
      },
    }),
    "Needs attention. Priya's review of the screening tools was due Oct 27 and hasn't come back. Public comment closes Nov 20, and the plan hasn't been accepted yet.",
  ),
];

type ProjectStoreState = {
  projects: Project[];
  createProject: (draft: ProjectDraft) => Project;
  getProject: (id: string) => Project | undefined;
  getProjectForChange: (changeId: string) => Project | undefined;
  getTask: (projectId: string, taskId: string) => ProjectTask | undefined;
  acceptPlan: (id: string) => void;
  assignTask: (projectId: string, taskId: string, owner: TaskOwner) => void;
  setTaskStatus: (projectId: string, taskId: string, status: TaskStatus) => void;
  nudgeTask: (projectId: string, taskId: string) => void;
  messageDelegate: (projectId: string, taskId: string, text: string) => void;
  addChatNote: (projectId: string, taskId: string, text: string) => void;
};

const nowIso = () => new Date().toISOString();

export const useProjectStore = create<ProjectStoreState>((set, get) => {
  /** Apply `update` to one task, then refresh the project's summary. */
  const updateTask = (projectId: string, taskId: string, update: (task: ProjectTask) => ProjectTask) =>
    set((state) => ({
      projects: state.projects.map((p) => {
        if (p.id !== projectId) return p;
        const plan = { ...p.plan, tasks: p.plan.tasks.map((t) => (t.id === taskId ? update(t) : t)) };
        return { ...p, plan };
      }),
    }));

  const append = (task: ProjectTask, ...messages: TaskMessage[]): ProjectTask => ({
    ...task,
    thread: [...task.thread, ...messages],
  });

  return {
    projects: [...SEED_PROJECTS],

    createProject: (draft) => {
      const fallbackName =
        REGULATORY_CHANGES.find((c) => c.id === draft.sourceChangeId)?.title ?? "Untitled project";
      const createdAt = nowIso();
      const base: Project = {
        ...draft,
        name: draft.name.trim() || fallbackName,
        id: makeId(),
        statusSummary: summarizeProject(draft),
        createdAt,
        plan: {
          ...draft.plan,
          tasks: draft.plan.tasks.map((t) => ({ ...t, thread: [assignmentEmail(t, createdAt)] })),
        },
      };
      const project = isCyberProject(base) ? progressCyberProject(base) : base;
      set((state) => ({ projects: [project, ...state.projects] }));
      return project;
    },

    getProject: (id) => get().projects.find((p) => p.id === id),

    getProjectForChange: (changeId) => get().projects.find((p) => p.sourceChangeId === changeId),

    getTask: (projectId, taskId) =>
      get().projects.find((p) => p.id === projectId)?.plan.tasks.find((t) => t.id === taskId),

    acceptPlan: (id) =>
      set((state) => ({
        projects: state.projects.map((p) => {
          if (p.id !== id) return p;
          const plan = { ...p.plan, status: "accepted" as const };
          return { ...p, plan, statusSummary: summarizeProject({ plan }) };
        }),
      })),

    assignTask: (projectId, taskId, owner) =>
      updateTask(projectId, taskId, (task) =>
        append({ ...task, delegate: owner, statusSummary: undefined }, reassignmentEmail(task, owner, nowIso())),
      ),

    setTaskStatus: (projectId, taskId, status) => {
      updateTask(projectId, taskId, (task) =>
        append({ ...task, status, statusSummary: undefined }, statusChangeNote(status, nowIso())),
      );
      set((state) => ({
        projects: state.projects.map((p) => (p.id === projectId ? { ...p, statusSummary: summarizeProject(p) } : p)),
      }));
    },

    nudgeTask: (projectId, taskId) =>
      updateTask(projectId, taskId, (task) => append({ ...task, statusSummary: undefined }, reminderEmail(task, nowIso()))),

    messageDelegate: (projectId, taskId, text) =>
      updateTask(projectId, taskId, (task) => append(task, messageEmail(task, text, nowIso()))),

    addChatNote: (projectId, taskId, text) => {
      const sentAt = nowIso();
      updateTask(projectId, taskId, (task) => append(task, gcChatMessage(text, sentAt), relayEmail(task, text, sentAt)));
    },
  };
});
