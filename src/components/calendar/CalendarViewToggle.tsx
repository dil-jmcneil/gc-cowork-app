import { ToggleButton, ToggleButtonGroup } from "@mui/material";

export type CalendarView = "timeline" | "calendar";

/** Figma CalendarViewToggle: Timeline | Calendar. */
export function CalendarViewToggle({
  value,
  onChange,
}: {
  value: CalendarView;
  onChange: (view: CalendarView) => void;
}) {
  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={(_, next: CalendarView | null) => next && onChange(next)}
      aria-label="Calendar view"
    >
      <ToggleButton value="timeline">Timeline</ToggleButton>
      <ToggleButton value="calendar">Calendar</ToggleButton>
    </ToggleButtonGroup>
  );
}
