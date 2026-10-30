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
