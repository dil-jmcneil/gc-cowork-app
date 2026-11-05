import { shownRelevance } from "./signal";

test("only two relevance reasons ever show", () => {
  expect(shownRelevance(["a", "b", "c", "d"])).toEqual(["a", "b"]);
  expect(shownRelevance(["a"])).toEqual(["a"]);
});
