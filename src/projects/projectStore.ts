import { create } from "zustand";

import { INSIGHTS } from "@/insights/insights";

import { isAtgProject, progressAtgProject } from "./atgStory";
import type { TaskOwner } from "./people";
import type { Project, ProjectDraft, ProjectTask, TaskStatus } from "./project";
import { summarizeProject } from "./projectDraft";
import type { TaskMessage } from "./thread";
import {
  assignmentEmail,
  gcChatMessage,
  messageEmail,
  reassignmentEmail,
  relayEmail,
  reminderEmail,
  statusChangeNote,
} from "./threadMessages";

function makeId() {
  return `project-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Projects that already exist when the app loads. The demo starts with none. */
export const SEED_PROJECTS: Project[] = [];

type ProjectStoreState = {
  projects: Project[];
  createProject: (draft: ProjectDraft) => Project;
  getProject: (id: string) => Project | undefined;
  getProjectForInsight: (insightId: string) => Project | undefined;
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
        const plan = {
          ...p.plan,
          tasks: p.plan.tasks.map((t) => (t.id === taskId ? update(t) : t)),
        };
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
      const fallbackName = INSIGHTS.find((c) => c.id === draft.sourceInsightId)?.title ?? "Untitled project";
      const createdAt = nowIso();
      const base: Project = {
        ...draft,
        name: draft.name.trim() || fallbackName,
        id: makeId(),
        statusSummary: summarizeProject(draft),
        createdAt,
        plan: {
          ...draft.plan,
          tasks: draft.plan.tasks.map((t) => ({
            ...t,
            thread: [assignmentEmail(t, createdAt)],
          })),
        },
      };
      const project = isAtgProject(base) ? progressAtgProject(base) : base;
      set((state) => ({ projects: [project, ...state.projects] }));
      return project;
    },

    getProject: (id) => get().projects.find((p) => p.id === id),

    getProjectForInsight: (insightId) => get().projects.find((p) => p.sourceInsightId === insightId),

    getTask: (projectId, taskId) =>
      get()
        .projects.find((p) => p.id === projectId)
        ?.plan.tasks.find((t) => t.id === taskId),

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
      updateTask(projectId, taskId, (task) =>
        append({ ...task, statusSummary: undefined }, reminderEmail(task, nowIso())),
      ),

    messageDelegate: (projectId, taskId, text) =>
      updateTask(projectId, taskId, (task) => append(task, messageEmail(task, text, nowIso()))),

    addChatNote: (projectId, taskId, text) => {
      const sentAt = nowIso();
      updateTask(projectId, taskId, (task) =>
        append(task, gcChatMessage(text, sentAt), relayEmail(task, text, sentAt)),
      );
    },
  };
});
