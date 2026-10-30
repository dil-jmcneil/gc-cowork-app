import { Stack, Typography, useTheme } from "@mui/material";
import { Link as RouterLink } from "react-router";

import { DateChip } from "@/components/calendar/DateChip";
import type { CalendarEvent, CalendarEventStatus } from "@/calendar/complianceEvents";

const STATUS_COLOR: Record<CalendarEventStatus, "information" | "success" | "error"> = {
  Assigned: "information",
  Complete: "success",
  Blocked: "error",
};

/** One compliance calendar event: date chip, status, title and description. Links to its chat/project/change. */
export function EventRow({ event, dense = false }: { event: CalendarEvent; dense?: boolean }) {
  const { tokens, presets } = useTheme();
  const StatusIndicator = presets.StatusIndicatorPresets.components.StatusIndicator;

  return (
    <Stack
      component={RouterLink}
      to={event.href}
      direction="row"
      alignItems="center"
      gap={1.5}
      sx={{
        px: dense ? 1 : 2,
        py: dense ? 0.75 : 1,
        borderRadius: tokens.semantic.radius.md.value,
        textDecoration: "none",
        color: "inherit",
        "&:hover": { bgcolor: tokens.semantic.color.surface.variant.value },
      }}
    >
      <DateChip date={event.date} muted={event.status === "Complete"} />
      <Stack gap={0.25} sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="textMd" sx={{ fontWeight: tokens.semantic.fontWeight.emphasis.value }} noWrap>
          {event.title}
        </Typography>
        <Typography variant="textSm" sx={{ color: tokens.semantic.color.type.muted.value }} noWrap>
          {event.description}
        </Typography>
      </Stack>
      <StatusIndicator color={STATUS_COLOR[event.status]} label={event.status} />
    </Stack>
  );
}
