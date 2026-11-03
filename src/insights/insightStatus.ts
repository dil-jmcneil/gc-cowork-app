import type { InsightStatus } from "./insight";

/** Atlas StatusIndicator color for each insight status. */
export const STATUS_COLOR: Record<InsightStatus, "information" | "warning" | "success" | "subtle"> = {
  New: "information",
  "In review": "warning",
  "In progress": "success",
  Closed: "subtle",
};
