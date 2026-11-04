import { capSupport, splitSentences, summaryText } from "./summary";

test("splits sentences without breaking dates, sections or quotes", () => {
  expect(splitSentences("Dana sent the memo on Nov 2. Alex Kim is waiting on it.")).toEqual([
    "Dana sent the memo on Nov 2.",
    "Alex Kim is waiting on it.",
  ]);
  expect(splitSentences('Nudge Maya Chen: "Choose a vendor" was due Nov 2.')).toHaveLength(1);
  expect(splitSentences("Article II, Section 8 predates the rule")).toHaveLength(1);
});

test("support keeps the first two sentences", () => {
  expect(capSupport(["One. Two. Three.", undefined, "Four."])).toEqual(["One.", "Two."]);
});

test("plain text joins the headline and support", () => {
  expect(summaryText({ headline: "Do this.", support: ["Because."] })).toBe("Do this. Because.");
});
