import { getPath, missingRequired, resolveContext, setPath, type A2uiSurface } from "./a2ui";

const surface: A2uiSurface = {
  surfaceId: "s",
  root: "root",
  components: [
    { id: "root", component: "Column", children: ["name", "email", "submit"] },
    { id: "name", component: "TextField", label: "Name", value: { path: "/people/0/name" }, required: true },
    {
      id: "email",
      component: "TextField",
      label: "Email",
      value: { path: "/people/0/email" },
      required: true,
      validationRegexp: "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$",
    },
    {
      id: "submit",
      component: "Button",
      label: "Save",
      action: { event: { name: "save", context: { people: { path: "/people" } } } },
    },
  ],
  dataModel: { people: [{ name: "", email: "" }] },
};

test("paths read and write the data model without mutating it", () => {
  const next = setPath(surface.dataModel, "/people/0/name", "Dana");
  expect(getPath(next, "/people/0/name")).toBe("Dana");
  expect(getPath(surface.dataModel, "/people/0/name")).toBe("");
});

test("a required field that's blank or fails its pattern is missing", () => {
  expect(missingRequired(surface, surface.dataModel)).toEqual(["name", "email"]);
  let data = setPath(surface.dataModel, "/people/0/name", "Dana");
  data = setPath(data, "/people/0/email", "dana@");
  expect(missingRequired(surface, data)).toEqual(["email"]);
  data = setPath(data, "/people/0/email", "dana@whitfieldcrane.com");
  expect(missingRequired(surface, data)).toEqual([]);
});

test("an action's context resolves its path bindings", () => {
  const data = setPath(surface.dataModel, "/people/0/name", "Dana");
  expect(resolveContext({ people: { path: "/people" }, kind: "owners" }, data)).toEqual({
    people: [{ name: "Dana", email: "" }],
    kind: "owners",
  });
});
