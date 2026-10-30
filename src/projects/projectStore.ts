import { create } from "zustand";

import { REGULATORY_CHANGES } from "@/regulatory/regulatoryChanges";

import type { Project, ProjectDraft } from "./project";
import { draftProjectFromChange, summarizeProject } from "./projectDraft";

function makeId() {
  return `project-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function seedProject(changeId: string, patch: (draft: ProjectDraft) => ProjectDraft, statusSummary: string): Project {
  const change = REGULATORY_CHANGES.find((c) => c.id === changeId)!;
  return {
    ...patch(draftProjectFromChange(change)),
    id: `project-${changeId}`,
    statusSummary,
    createdAt: "2026-10-12T14:00:00Z",
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
        tasks: draft.plan.tasks.map((t, i) => ({ ...t, status: i === 0 ? "Done" : i === 1 ? "In progress" : t.status })),
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
        // The gap review slipped past its date, so the calendar shows it Blocked with a Nudge.
        tasks: draft.plan.tasks.map((t, i) =>
          i === 0 ? { ...t, status: "In progress" as const, deadline: "2026-10-27" } : t,
        ),
      },
    }),
    "Needs attention. Maya's gap review with HR was due Oct 27 and hasn't come back. Public comment closes Nov 20, and the plan hasn't been accepted yet.",
  ),
];

type ProjectStoreState = {
  projects: Project[];
  createProject: (draft: ProjectDraft) => Project;
  getProject: (id: string) => Project | undefined;
  getProjectForChange: (changeId: string) => Project | undefined;
  acceptPlan: (id: string) => void;
};

export const useProjectStore = create<ProjectStoreState>((set, get) => ({
  projects: [...SEED_PROJECTS],

  createProject: (draft) => {
    const fallbackName = REGULATORY_CHANGES.find((c) => c.id === draft.sourceChangeId)?.title ?? "Untitled project";
    const project: Project = {
      ...draft,
      name: draft.name.trim() || fallbackName,
      id: makeId(),
      statusSummary: summarizeProject(draft),
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ projects: [project, ...state.projects] }));
    return project;
  },

  getProject: (id) => get().projects.find((p) => p.id === id),

  getProjectForChange: (changeId) => get().projects.find((p) => p.sourceChangeId === changeId),

  acceptPlan: (id) =>
    set((state) => ({
      projects: state.projects.map((p) => {
        if (p.id !== id) return p;
        const plan = { ...p.plan, status: "accepted" as const };
        return { ...p, plan, statusSummary: summarizeProject({ plan }) };
      }),
    })),
}));
