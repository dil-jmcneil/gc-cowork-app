import {
  addDays,
  addMonths,
  dateTense,
  formatDateRange,
  formatMonthYear,
  monthGridDates,
  relativeBucket,
  startOfMonth,
  startOfWeek,
  workWeekDates,
} from "@/calendar/weeks";

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

test("addMonths keeps the first of the month", () => {
  expect(addMonths("2026-10-01", 1)).toBe("2026-11-01");
  expect(addMonths("2026-01-01", -1)).toBe("2025-12-01");
});

test("startOfMonth returns the first day", () => {
  expect(startOfMonth("2026-10-30")).toBe("2026-10-01");
});

test("monthGridDates covers whole Monday-to-Sunday weeks around the month", () => {
  const dates = monthGridDates("2026-10-01");
  expect(dates[0]).toBe("2026-09-28"); // Monday before Oct 1 (a Thursday)
  expect(dates.length % 7).toBe(0);
  expect(dates).toContain("2026-10-31");
  expect(dates[dates.length - 1]).toBe("2026-11-01"); // Sunday after Oct 31 (a Saturday)
});

test("formatMonthYear reads like a calendar title", () => {
  expect(formatMonthYear("2026-10-01")).toBe("October 2026");
});

test("dateTense compares a date to today", () => {
  expect(dateTense("2026-10-29", "2026-10-30")).toBe("past");
  expect(dateTense("2026-10-30", "2026-10-30")).toBe("present");
  expect(dateTense("2026-10-31", "2026-10-30")).toBe("future");
});

test("relativeBucket groups dates the way the Figma timeline does", () => {
  const today = "2026-10-30"; // Friday
  expect(relativeBucket("2026-10-26", today)).toBe("This week");
  expect(relativeBucket("2026-11-04", today)).toBe("Next week");
  expect(relativeBucket("2026-11-20", today)).toBe("Later this month");
  expect(relativeBucket("2026-12-15", today)).toBe("1 month out");
  expect(relativeBucket("2027-01-15", today)).toBe("2 months out");
  expect(relativeBucket("2026-10-20", today)).toBe("Earlier");
});
