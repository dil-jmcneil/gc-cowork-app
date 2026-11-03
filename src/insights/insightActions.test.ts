import { projectActionForInsight } from "@/insights/insightActions";
import type { Project } from "@/projects/project";

const PROJECT = { id: "project-1", name: "Cyber readiness" } as Project;

test("offers to create a project when none exists", () => {
  const action = projectActionForInsight("atg-v-lane", undefined);
  expect(action).toEqual({
    kind: "create",
    href: "/workstreams/new?insight=atg-v-lane",
  });
});

test("links to the existing project when one exists", () => {
  const action = projectActionForInsight("atg-v-lane", PROJECT);
  expect(action).toEqual({
    kind: "view",
    href: "/workstreams/project-1",
    projectName: "Cyber readiness",
  });
});
