function parse(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Shifts an ISO date by `n` days (negative to go back). */
export function addDays(iso: string, n: number): string {
  const date = parse(iso);
  date.setUTCDate(date.getUTCDate() + n);
  return toIso(date);
}

/** The Monday on or before `iso`. */
export function startOfWeek(iso: string): string {
  const day = parse(iso).getUTCDay(); // 0 = Sunday .. 6 = Saturday
  const sinceMonday = day === 0 ? 6 : day - 1;
  return addDays(iso, -sinceMonday);
}

/** The five weekdays (Mon–Fri) starting from a Monday. */
export function workWeekDates(monday: string): string[] {
  return [0, 1, 2, 3, 4].map((n) => addDays(monday, n));
}

const MONTH_DAY = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

/** "Oct 26 to Nov 6", matching the Figma Compliance Calendar header. */
export function formatDateRange(startIso: string, endIso: string): string {
  return `${MONTH_DAY.format(parse(startIso))} to ${MONTH_DAY.format(parse(endIso))}`;
}

/** The first day of the month containing `iso`. */
export function startOfMonth(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

/** The first of the month `n` months after the month containing `iso`. */
export function addMonths(iso: string, n: number): string {
  const date = parse(startOfMonth(iso));
  date.setUTCMonth(date.getUTCMonth() + n);
  return toIso(date);
}

/** Whole Monday-to-Sunday weeks covering the month that contains `iso`. */
export function monthGridDates(iso: string): string[] {
  const first = startOfMonth(iso);
  const last = addDays(addMonths(first, 1), -1);
  const gridStart = startOfWeek(first);
  const gridEnd = addDays(startOfWeek(last), 6);
  const dates: string[] = [];
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) dates.push(d);
  return dates;
}

const MONTH_YEAR = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

/** "October 2026". */
export function formatMonthYear(iso: string): string {
  return MONTH_YEAR.format(parse(iso));
}

export type DateTense = "past" | "present" | "future";

export function dateTense(iso: string, todayIso: string): DateTense {
  if (iso < todayIso) return "past";
  if (iso === todayIso) return "present";
  return "future";
}

function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((parse(toIso).getTime() - parse(fromIso).getTime()) / 86_400_000);
}

/** Timeline section for a date relative to today: this week, next week, then months out. */
export function relativeBucket(iso: string, todayIso: string): string {
  const thisWeek = startOfWeek(todayIso);
  const weekOf = startOfWeek(iso);
  if (weekOf < thisWeek) return "Earlier";
  if (weekOf === thisWeek) return "This week";
  if (weekOf === addDays(thisWeek, 7)) return "Next week";
  const months = Math.floor(daysBetween(todayIso, iso) / 30);
  if (months === 0) return "Later this month";
  return `${months} month${months === 1 ? "" : "s"} out`;
}
