import { Navigate, useParams } from "react-router";

import { useMvpScopeStore } from "@/demo/mvpScopeStore";
import { workstreamHref } from "@/workstreams/links";
import { useWorkstreamStore } from "@/workstreams/workstreamStore";

import TaskPage from "./TaskPage";

/**
 * MVP: there are no task pages, so an old task link opens the workstream on
 * that task, highlighted. The task page comes back with post-MVP views on.
 */
export default function TaskRoute() {
  const { workstreamId = "", taskId = "" } = useParams<{ workstreamId: string; taskId: string }>();
  const showPostMvpViews = useMvpScopeStore((s) => s.showPostMvpViews);
  const task = useWorkstreamStore((s) => s.getTask(workstreamId, taskId));
  if (showPostMvpViews) return <TaskPage />;
  return <Navigate replace to={workstreamHref(workstreamId, task ? { taskId } : {})} />;
}
