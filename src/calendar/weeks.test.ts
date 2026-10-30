import { addDays, formatDateRange, startOfWeek, workWeekDates } from "@/calendar/weeks";

test("startOfWeek returns the Monday on or before the date", () => {
  expect(startOfWeek("2026-11-04")).toBe("2026-11-02"); // Wednesday -> Monday
  expect(startOfWeek("2026-11-02")).toBe("2026-11-02"); // already Monday
  expect(startOfWeek("2026-11-01")).toBe("2026-10-26"); // Sunday -> prior Monday
});

test("addDays shifts an ISO date by n days", () => {
  expect(addDays("2026-10-26", 5)).toBe("2026-10-31");
  expect(addDays("2026-10-26", -1)).toBe("2026-10-25");
});

test("workWeekDates returns the five weekdays starting Monday", () => {
  expect(workWeekDates("2026-10-26")).toEqual([
    "2026-10-26",
    "2026-10-27",
    "2026-10-28",
    "2026-10-29",
    "2026-10-30",
  ]);
});

test("formatDateRange reads like the Figma header", () => {
  expect(formatDateRange("2026-10-26", "2026-11-06")).toBe("Oct 26 to Nov 6");
});
