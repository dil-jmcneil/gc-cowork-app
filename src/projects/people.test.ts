import { DIRECTORY, suggestOwners } from "@/projects/people";

test("empty input lists the directory", () => {
  expect(suggestOwners("")).toEqual(DIRECTORY);
});

test("matches directory people by name, role, or email", () => {
  expect(suggestOwners("maya").map((o) => o.label)).toEqual(["Maya Chen"]);
  expect(suggestOwners("privacy").map((o) => o.label)).toContain("Jordan Lee");
  expect(suggestOwners("sam.ortiz@").map((o) => o.label)).toEqual(["Sam Ortiz"]);
});

test("an email address becomes an external email option", () => {
  const options = suggestOwners("jane@outsidecounsel.com");
  expect(options).toContainEqual(
    expect.objectContaining({ kind: "email", label: "jane@outsidecounsel.com" }),
  );
});

test("an email already in the directory doesn't add a duplicate external option", () => {
  const options = suggestOwners("maya.chen@acme.com");
  expect(options.map((o) => o.kind)).toEqual(["directory"]);
});

test("an @handle offers Slack and Teams options", () => {
  const options = suggestOwners("@dana.r");
  expect(options).toContainEqual(expect.objectContaining({ kind: "slack", label: "@dana.r" }));
  expect(options).toContainEqual(expect.objectContaining({ kind: "teams", label: "@dana.r" }));
});

test("plain text with no directory match offers nothing external", () => {
  expect(suggestOwners("zzz")).toEqual([]);
});
