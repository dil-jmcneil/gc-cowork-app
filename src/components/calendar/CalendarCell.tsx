import { Box, Stack, Tooltip, Typography, useTheme } from "@mui/material";

import type { CalendarEvent } from "@/calendar/complianceEvents";
import { dateTense } from "@/calendar/weeks";

import { StatusDot } from "./StatusDot";
import { EventHoverDetails } from "./TimelineItem";

const WEEKDAY = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" });
const DAY = new Intl.DateTimeFormat("en-US", { day: "numeric", timeZone: "UTC" });
const MONTH = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });

/**
 * One day in the Figma Calendar view: "MON 26 OCT" heading over event chips,
 * with Past (grey), Present (blue) and Future (subtle) treatments.
 */
export function CalendarCell({
  date,
  events,
  todayIso,
  showMonth,
  outsideMonth = false,
  minHeight = 140,
  maxEvents,
  showWeekday = true,
  onOpen,
}: {
  date: string;
  events: CalendarEvent[];
  todayIso: string;
  showMonth: boolean;
  /** Days from the neighbouring month in a month grid. */
  outsideMonth?: boolean;
  minHeight?: number;
  /** Show at most this many events, then "+N more". */
  maxEvents?: number;
  /** Month grids label weekdays in a header row instead. */
  showWeekday?: boolean;
  onOpen: (event: CalendarEvent) => void;
}) {
  const { tokens } = useTheme();
  const { color } = tokens.semantic;
  const tense = dateTense(date, todayIso);
  const parsed = new Date(`${date}T00:00:00Z`);
  const shown = maxEvents ? events.slice(0, maxEvents) : events;
  const hidden = events.length - shown.length;

  const look = {
    past: { bg: color.status.neutral.backgroundVariant.value, border: "transparent", text: color.type.disabled.value },
    present: {
      bg: color.status.notification.background.value,
      border: color.status.notification.default.value,
      text: color.status.notification.text.value,
    },
    future: { bg: color.surface.subtle.value, border: "transparent", text: color.type.muted.value },
  }[tense];
  const dim = outsideMonth && tense !== "present";

  return (
    <Box
      aria-current={tense === "present" ? "date" : undefined}
      sx={{
        minHeight,
        p: 1,
        borderRadius: tokens.semantic.radius.md.value,
        border: `1px solid ${look.border}`,
        bgcolor: look.bg,
        opacity: dim ? 0.55 : 1,
        minWidth: 0,
      }}
    >
      <Stack gap={1}>
        <Stack direction="row" alignItems="baseline" gap={0.5} sx={{ color: look.text }}>
          {showWeekday ? (
            <Typography variant="textSm" sx={{ color: "inherit", textTransform: "uppercase" }}>
              {WEEKDAY.format(parsed)}
            </Typography>
          ) : null}
          <Typography
            variant="textMd"
            sx={{
              color: tense === "past" ? "inherit" : color.type.default.value,
              fontWeight: tokens.semantic.fontWeight.emphasis.value,
              ...(tense === "present" ? { color: color.status.notification.text.value } : {}),
            }}
          >
            {DAY.format(parsed)}
          </Typography>
          {showMonth ? (
            <Typography variant="textSm" sx={{ color: "inherit", textTransform: "uppercase" }}>
              {MONTH.format(parsed)}
            </Typography>
          ) : null}
        </Stack>
        <Stack gap={0.5}>
          {shown.map((event) => (
            <CalendarEventChip key={event.id} event={event} past={tense === "past"} onOpen={onOpen} />
          ))}
          {hidden > 0 ? (
            <Typography variant="textSm" sx={{ color: color.type.muted.value, px: 1 }}>
              +{hidden} more
            </Typography>
          ) : null}
        </Stack>
      </Stack>
    </Box>
  );
}

function CalendarEventChip({
  event,
  past,
  onOpen,
}: {
  event: CalendarEvent;
  past: boolean;
  onOpen: (event: CalendarEvent) => void;
}) {
  const { tokens } = useTheme();
  const { color } = tokens.semantic;
  return (
    <Tooltip title={<EventHoverDetails event={event} />} placement="top-start" enterDelay={300}>
      <Stack
        component="button"
        type="button"
        onClick={() => onOpen(event)}
        direction="row"
        alignItems="flex-start"
        gap={0.75}
        sx={{
          width: "100%",
          border: "none",
          font: "inherit",
          textAlign: "left",
          cursor: "pointer",
          px: 1,
          py: 0.75,
          borderRadius: tokens.semantic.radius.md.value,
          bgcolor: past ? color.surface.subtle.value : color.surface.default.value,
          color: past ? color.type.muted.value : color.type.default.value,
          textDecoration: "none",
          "&:hover": { bgcolor: color.surface.variant.value },
        }}
      >
        <Box sx={{ pt: "4px" }}>
          <StatusDot status={event.status} />
        </Box>
        <Typography
          variant="textSm"
          sx={{
            color: "inherit",
            lineHeight: "18px",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {event.title}
        </Typography>
      </Stack>
    </Tooltip>
  );
}
