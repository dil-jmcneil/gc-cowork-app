import { newestFirst } from "./thread";

test("puts the most recent entry first", () => {
  const entries = [
    { id: "a", at: "2026-10-27T09:00:00Z" },
    { id: "b", at: "2026-10-29T09:00:00Z" },
    { id: "c", at: "2026-10-28T09:00:00Z" },
  ];
  expect(newestFirst(entries, (e) => e.at).map((e) => e.id)).toEqual(["b", "c", "a"]);
});

test("entries at the same time show the later-recorded one first", () => {
  const entries = [
    { id: "first", at: "2026-10-27T09:00:00Z" },
    { id: "second", at: "2026-10-27T09:00:00Z" },
  ];
  expect(newestFirst(entries, (e) => e.at).map((e) => e.id)).toEqual(["second", "first"]);
});

test("it doesn't change the list it's given", () => {
  const entries = [{ at: "2026-10-27T09:00:00Z" }, { at: "2026-10-28T09:00:00Z" }];
  newestFirst(entries, (e) => e.at);
  expect(entries[0].at).toBe("2026-10-27T09:00:00Z");
});
