import type { A2uiComponent, A2uiSurface } from "@/chat/a2ui";

import { isUnassigned, ownerFromEntry, type OwnerEntry, type TaskOwner } from "./people";
import { formatShortDate, orderedTasks } from "./taskStatus";
import type { WorkstreamTask } from "./workstream";

/** The suggested actions Cowork offers on a new draft. */
export const MAKE_CHANGES = "Make changes to the plan";
export const ADD_OWNERS = "Add owners to tasks";
export const START_WORKSTREAM_ACTION = "Start workstream";

/** The owner form's submit event. */
export const ASSIGN_OWNERS_EVENT = "assign_owners";

const EMAIL_PATTERN = "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$";

export function asksToAddOwners(text: string): boolean {
  const message = text.trim();
  return !message.endsWith("?") && /\b(add|assign|set|enter|pick)\b.*\bowners?\b/i.test(message);
}

export function asksToChangePlan(text: string): boolean {
  return /^(make )?changes? to the plan\.?$/i.test(text.trim());
}

export function unassignedCount(tasks: WorkstreamTask[]): number {
  return tasks.filter((t) => isUnassigned(t.delegate)).length;
}

/**
 * The A2UI owner form: one card per task, in plan order, each asking for the
 * owner's first name, last name and email; one button submits them all.
 */
export function ownerFormSurface(tasks: WorkstreamTask[]): A2uiSurface {
  const ordered = orderedTasks(tasks);
  const components: A2uiComponent[] = [];
  const cards = ordered.map((task, i) => {
    const at = (field: keyof OwnerEntry) => ({ path: `/owners/${i}/${field}` });
    const id = (part: string) => `task-${i}-${part}`;
    components.push(
      { id: id("card"), component: "Card", child: id("body") },
      { id: id("body"), component: "Column", children: [id("title"), id("due"), id("name"), id("email")] },
      { id: id("title"), component: "Text", text: `${i + 1} · ${task.description}`, variant: "h6" },
      { id: id("due"), component: "Text", text: `Due ${formatShortDate(task.deadline)}`, variant: "textMd", color: "muted" },
      { id: id("name"), component: "Row", children: [id("first"), id("last")] },
      { id: id("first"), component: "TextField", label: "First name", value: at("firstName"), required: true },
      { id: id("last"), component: "TextField", label: "Last name", value: at("lastName"), required: true },
      {
        id: id("email"),
        component: "TextField",
        label: "Email",
        value: at("email"),
        required: true,
        placeholder: "name@company.com",
        validationRegexp: EMAIL_PATTERN,
      },
    );
    return id("card");
  });
  components.unshift(
    { id: "root", component: "Column", children: [...cards, "submit"] },
    {
      id: "submit",
      component: "Button",
      label: "Add owners",
      requireFields: true,
      action: { event: { name: ASSIGN_OWNERS_EVENT, context: { owners: { path: "/owners" } } } },
    },
  );
  return {
    surfaceId: `owners-${Date.now()}`,
    root: "root",
    components,
    dataModel: {
      owners: ordered.map((task) => ({ taskId: task.id, ...entryFor(task.delegate) })),
    },
  };
}

/** The form's starting values: blank for an unassigned task, else the owner you already added. */
function entryFor(owner: TaskOwner): OwnerEntry {
  if (isUnassigned(owner)) return { firstName: "", lastName: "", email: "" };
  const [firstName = "", ...rest] = owner.label.split(" ");
  return { firstName, lastName: rest.join(" "), email: owner.id.replace(/^email:/, "") };
}

/** The owner for each task id, from the form's submitted context. */
export function ownersFromContext(context: Record<string, unknown>): Record<string, TaskOwner> {
  const rows = Array.isArray(context.owners) ? (context.owners as (OwnerEntry & { taskId: string })[]) : [];
  return Object.fromEntries(
    rows.filter((row) => row.taskId && row.email?.trim()).map((row) => [row.taskId, ownerFromEntry(row)]),
  );
}

/** Tasks with their new owners; tasks not in the form (or removed since) are left as they were. */
export function assignOwners(tasks: WorkstreamTask[], owners: Record<string, TaskOwner>): WorkstreamTask[] {
  return tasks.map((task) => (owners[task.id] ? { ...task, delegate: owners[task.id] } : task));
}
