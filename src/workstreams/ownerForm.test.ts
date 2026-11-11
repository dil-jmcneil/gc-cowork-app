import { ATG_RULING } from "@/signals/signals";
import { missingRequired, setPath } from "@/chat/a2ui";

import { isUnassigned, ownerFromEntry } from "./people";
import { asksToAddOwners, assignOwners, ownerFormSurface, ownersFromContext, unassignedCount } from "./ownerForm";
import { draftWorkstreamFromSignal } from "./workstreamDraft";

const draft = () => draftWorkstreamFromSignal(ATG_RULING, { owners: "unassigned" });

test("a draft for the GC starts with no owners", () => {
  const { plan } = draft();
  expect(plan.tasks.every((t) => isUnassigned(t.delegate))).toBe(true);
  expect(unassignedCount(plan.tasks)).toBe(plan.tasks.length);
});

test("the form has a card per task, in plan order, each asking for first name, last name and email", () => {
  const surface = ownerFormSurface(draft().plan.tasks);
  const titles = surface.components.filter((c) => c.component === "Text" && c.variant === "h6");
  expect(titles.map((c) => (c.component === "Text" ? c.text : ""))).toEqual([
    "1 · Get counsel's view",
    "2 · Prepare the change",
    "3 · Adopt and disclose the amendment",
    "4 · Watch the nomination window",
  ]);
  const labels = surface.components.flatMap((c) => (c.component === "TextField" ? [c.label] : []));
  expect(labels.slice(0, 3)).toEqual(["First name", "Last name", "Email"]);
  expect(missingRequired(surface, surface.dataModel)).toHaveLength(12);
});

test("removing a task first leaves it out of the form", () => {
  const { plan } = draft();
  const surface = ownerFormSurface(plan.tasks.slice(0, 3));
  expect(surface.components.filter((c) => c.component === "Card")).toHaveLength(3);
});

test("submitted owners land on their tasks; an email outside acme.com is an outside owner", () => {
  const { plan } = draft();
  const surface = ownerFormSurface(plan.tasks);
  let data = surface.dataModel;
  data = setPath(data, "/owners/0/firstName", "Dana");
  data = setPath(data, "/owners/0/lastName", "Whitfield");
  data = setPath(data, "/owners/0/email", "dana.whitfield@whitfieldcrane.com");
  data = setPath(data, "/owners/1/firstName", "Jamie");
  data = setPath(data, "/owners/1/lastName", "Fox");
  data = setPath(data, "/owners/1/email", "jamie.fox@acme.com");
  const owners = ownersFromContext({ owners: (data as { owners: unknown }).owners });
  const tasks = assignOwners(plan.tasks, owners);
  expect(tasks[0].delegate).toMatchObject({ label: "Dana Whitfield", kind: "email" });
  expect(tasks[1].delegate).toMatchObject({ label: "Jamie Fox", kind: "directory" });
  expect(isUnassigned(tasks[2].delegate)).toBe(true);
});

test("a directory email keeps that person's role", () => {
  expect(ownerFromEntry({ firstName: "Alex", lastName: "Kim", email: "Alex.Kim@acme.com" }).detail).toMatch(
    /Corporate secretary/,
  );
});

test("the GC can ask for the owner form in their own words", () => {
  for (const text of ["Add owners to tasks", "assign owners", "Set the owners"]) expect(asksToAddOwners(text)).toBe(true);
  expect(asksToAddOwners("Who owns task 2?")).toBe(false);
});
