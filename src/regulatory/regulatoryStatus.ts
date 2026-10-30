import type { RegulatoryChangeStatus } from "./regulatoryChange";

/** Atlas StatusIndicator color for each regulatory change status. */
export const STATUS_COLOR: Record<RegulatoryChangeStatus, "information" | "warning" | "subtle"> = {
  New: "information",
  "In review": "warning",
  Upcoming: "subtle",
};
