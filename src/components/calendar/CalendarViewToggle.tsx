import { ToggleButton, ToggleButtonGroup } from "@mui/material";

export type CalendarView = "timeline" | "swimlane" | "calendar";

/** Atlas toggle button group, small: Timeline | Swimlane | Calendar. */
export function CalendarViewToggle({
  value,
  onChange,
}: {
  value: CalendarView;
  onChange: (view: CalendarView) => void;
}) {
  return (
    <ToggleButtonGroup
      size="small"
      value={value}
      exclusive
      onChange={(_, next: CalendarView | null) => next && onChange(next)}
      aria-label="Calendar view"
    >
      <ToggleButton value="timeline">Timeline</ToggleButton>
      <ToggleButton value="swimlane">Swimlane</ToggleButton>
      <ToggleButton value="calendar">Calendar</ToggleButton>
    </ToggleButtonGroup>
  );
}
