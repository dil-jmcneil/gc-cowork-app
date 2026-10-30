import type { Project } from "@/projects/project";

export type ProjectAction =
  | { kind: "create"; href: string }
  | { kind: "view"; href: string; projectName: string };

/** Whether a regulatory change's card/dialog should offer to create a project or open its existing one. */
export function projectActionForChange(changeId: string, project: Project | undefined): ProjectAction {
  if (project) return { kind: "view", href: `/projects/${project.id}`, projectName: project.name };
  return { kind: "create", href: `/projects/new?change=${encodeURIComponent(changeId)}` };
}
