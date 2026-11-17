import { expect, test } from "vitest";

import { AGENDA_FILE, COMPARISON_FILE, MEMO_FILE, OUTLINE_FILE } from "./atgFiles";

test("file names stay under 40 characters", () => {
  for (const name of [MEMO_FILE, COMPARISON_FILE, AGENDA_FILE, OUTLINE_FILE]) {
    expect(name.length, name).toBeLessThan(40);
  }
});
