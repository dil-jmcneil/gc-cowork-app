import type { Signal, SignalStatus } from "./signal";

/** Atlas StatusIndicator color for each signal status. */
export const STATUS_COLOR: Record<SignalStatus, "information" | "warning" | "success" | "subtle"> = {
  New: "information",
  "In review": "warning",
  "In progress": "success",
  Closed: "subtle",
};

/** A new signal reads "In progress" once the GC has started a workstream for it. */
export function currentStatus(signal: Pick<Signal, "status">, hasWorkstream: boolean): SignalStatus {
  return hasWorkstream && signal.status === "New" ? "In progress" : signal.status;
}
