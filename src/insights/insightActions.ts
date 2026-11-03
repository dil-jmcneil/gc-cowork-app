import type { Project } from "@/projects/project";

export type ProjectAction = { kind: "create"; href: string } | { kind: "view"; href: string; projectName: string };

/** Whether a insight's card/dialog should offer to create a project or open its existing one. */
export function projectActionForInsight(insightId: string, project: Project | undefined): ProjectAction {
  if (project)
    return {
      kind: "view",
      href: `/projects/${project.id}`,
      projectName: project.name,
    };
  return {
    kind: "create",
    href: `/projects/new?insight=${encodeURIComponent(insightId)}`,
  };
}
