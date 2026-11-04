/** Where on the workstream page a link opens: a task, scrolled to and highlighted. */
export type WorkstreamFocus = { taskId?: string };

/**
 * The one page every link goes to in the MVP. A focus opens the page on that
 * task, highlighted, instead of a task page or dialog.
 */
export function workstreamHref(workstreamId: string, focus: WorkstreamFocus = {}): string {
  const params = new URLSearchParams();
  if (focus.taskId) params.set("task", focus.taskId);
  const query = params.toString();
  return `/workstreams/${workstreamId}${query ? `?${query}` : ""}`;
}

export function workstreamFocusFromSearch(search: string): WorkstreamFocus {
  const params = new URLSearchParams(search);
  const focus: WorkstreamFocus = {};
  const taskId = params.get("task");
  if (taskId) focus.taskId = taskId;
  return focus;
}

/** A signal with no workstream yet opens Cowork's draft on the same page. */
export function draftWorkstreamHref(signalId: string): string {
  return `/workstreams/new?signal=${encodeURIComponent(signalId)}`;
}
