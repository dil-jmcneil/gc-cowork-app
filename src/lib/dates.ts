const withYear = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

/** "Mar 14, 2027" from an ISO yyyy-mm-dd date, independent of the local time zone. */
export function formatDate(iso: string): string {
  return withYear.format(new Date(`${iso}T00:00:00Z`));
}
