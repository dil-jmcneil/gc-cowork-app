import { Box, Stack, Typography, useTheme } from "@mui/material";

import type { CalendarEventStatus } from "@/calendar/complianceEvents";

/** Saturated status dot from the Figma Shared Calendar "Status" building block. */
export function StatusDot({ status }: { status: CalendarEventStatus }) {
  const { tokens } = useTheme();
  // The semantic status "default" tokens are pastel; Figma's dots are the saturated core shades.
  const core = tokens.core.color;
  const color = {
    Assigned: core.indigo["40"].value,
    Complete: core.moss["40"].value,
    Blocked: core.red["40"].value,
  }[status];
  return (
    <Box
      role="img"
      aria-label={status}
      sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: color, flexShrink: 0 }}
    />
  );
}

const LEGEND: CalendarEventStatus[] = ["Assigned", "Complete", "Blocked"];

/** Dot-and-label legend shown at the right of the calendar toolbar. */
export function CalendarLegend() {
  const { tokens } = useTheme();
  return (
    <Stack direction="row" gap={2} alignItems="center" aria-label="Status legend">
      {LEGEND.map((status) => (
        <Stack key={status} direction="row" gap={1} alignItems="center">
          <StatusDot status={status} />
          <Typography variant="textSm" sx={{ color: tokens.semantic.color.type.default.value }}>
            {status}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}
