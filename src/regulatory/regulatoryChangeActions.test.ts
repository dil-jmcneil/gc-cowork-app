import { projectActionForChange } from "@/regulatory/regulatoryChangeActions";
import type { Project } from "@/projects/project";

const PROJECT = { id: "project-1", name: "Cyber readiness" } as Project;

test("offers to create a project when none exists", () => {
  const action = projectActionForChange("sec-cyber-8k-105", undefined);
  expect(action).toEqual({ kind: "create", href: "/projects/new?change=sec-cyber-8k-105" });
});

test("links to the existing project when one exists", () => {
  const action = projectActionForChange("sec-cyber-8k-105", PROJECT);
  expect(action).toEqual({ kind: "view", href: "/projects/project-1", projectName: "Cyber readiness" });
});
