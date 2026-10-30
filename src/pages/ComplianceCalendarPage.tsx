import ChevronLeftIcon from "@diligentcorp/atlas-react-bundle/icons/ArrowLeft";
import ChevronRightIcon from "@diligentcorp/atlas-react-bundle/icons/ArrowRight";
import {
  Box,
  Button,
  Container,
  IconButton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme,
} from "@mui/material";
import { useMemo, useState } from "react";
import { Link as RouterLink } from "react-router";

import { deriveCalendarEvents, type CalendarEvent } from "@/calendar/complianceEvents";
import { addDays, formatDateRange, startOfWeek, workWeekDates } from "@/calendar/weeks";
import { EventRow } from "@/components/calendar/EventRow";
import { useProjectStore } from "@/projects/projectStore";

type CalendarView = "timeline" | "calendar";

const DAY_LABEL = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" });
const DAY_NUMBER = new Intl.DateTimeFormat("en-US", { day: "numeric", timeZone: "UTC" });

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function ComplianceCalendarPage() {
  const { tokens } = useTheme();
  const projects = useProjectStore((s) => s.projects);
  const events = useMemo(() => deriveCalendarEvents(projects, new Date()), [projects]);

  const [view, setView] = useState<CalendarView>("timeline");
  const [anchor, setAnchor] = useState(() => startOfWeek(todayIso()));
  const stepDays = view === "timeline" ? 7 : 14;
  const rangeEnd = addDays(anchor, view === "timeline" ? 34 : 11);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack gap={3}>
        <Stack gap={0.5}>
          <Typography variant="h4" component="h1">
            Compliance calendar
          </Typography>
          <Typography variant="textMd" sx={{ color: tokens.semantic.color.type.muted.value }}>
            One timeline for you and your team.
          </Typography>
        </Stack>

        <ToggleButtonGroup
          value={view}
          exclusive
          size="small"
          onChange={(_, next: CalendarView | null) => next && setView(next)}
          aria-label="Calendar view"
        >
          <ToggleButton value="timeline">Timeline</ToggleButton>
          <ToggleButton value="calendar">Calendar</ToggleButton>
        </ToggleButtonGroup>

        <Box
          sx={{
            border: `1px solid ${tokens.semantic.color.outline.fixed.value}`,
            borderRadius: tokens.semantic.radius.lg.value,
            bgcolor: tokens.semantic.color.surface.default.value,
            p: 2.5,
          }}
        >
          <Stack gap={2}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5}>
              <Stack direction="row" alignItems="center" gap={1}>
                <IconButton
                  size="small"
                  aria-label="Previous"
                  onClick={() => setAnchor((a) => addDays(a, -stepDays))}
                >
                  <ChevronLeftIcon aria-hidden style={{ width: 16, height: 16 }} />
                </IconButton>
                <Typography variant="textMd" sx={{ fontWeight: tokens.semantic.fontWeight.emphasis.value }}>
                  {formatDateRange(anchor, rangeEnd)}
                </Typography>
                <IconButton size="small" aria-label="Next" onClick={() => setAnchor((a) => addDays(a, stepDays))}>
                  <ChevronRightIcon aria-hidden style={{ width: 16, height: 16 }} />
                </IconButton>
                <Button variant="outlined" size="small" onClick={() => setAnchor(startOfWeek(todayIso()))}>
                  Today
                </Button>
              </Stack>
              <CalendarLegend />
            </Stack>

            {view === "timeline" ? (
              <TimelineView anchor={anchor} events={events} />
            ) : (
              <CalendarGridView anchor={anchor} events={events} />
            )}
          </Stack>
        </Box>
      </Stack>
    </Container>
  );
}

function CalendarLegend() {
  const { presets } = useTheme();
  const StatusIndicator = presets.StatusIndicatorPresets.components.StatusIndicator;
  return (
    <Stack direction="row" gap={1} flexWrap="wrap">
      <StatusIndicator color="information" label="Assigned" />
      <StatusIndicator color="success" label="Complete" />
      <StatusIndicator color="error" label="Blocked" />
    </Stack>
  );
}

function TimelineView({ anchor, events }: { anchor: string; events: CalendarEvent[] }) {
  const { tokens } = useTheme();
  const rangeEnd = addDays(anchor, 34);
  const visible = events.filter((e) => e.date >= anchor && e.date <= rangeEnd);
  const thisWeekLabel = startOfWeek(todayIso());

  const groups = useMemo(() => {
    const byWeek = new Map<string, CalendarEvent[]>();
    for (const event of visible) {
      const weekStart = startOfWeek(event.date);
      const group = byWeek.get(weekStart) ?? [];
      group.push(event);
      byWeek.set(weekStart, group);
    }
    return [...byWeek.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [visible]);

  if (groups.length === 0) {
    return (
      <Typography variant="textMd" sx={{ color: tokens.semantic.color.type.muted.value }}>
        Nothing in this range.
      </Typography>
    );
  }

  return (
    <Stack gap={2}>
      {groups.map(([weekStart, weekEvents]) => (
        <Stack key={weekStart} gap={0.5}>
          <Typography
            variant="textSm"
            sx={{
              color: tokens.semantic.color.type.muted.value,
              fontWeight: tokens.semantic.fontWeight.emphasis.value,
              letterSpacing: "0.6px",
              textTransform: "uppercase",
              px: 2,
            }}
          >
            {weekStart === thisWeekLabel ? "This week" : formatDateRange(weekStart, addDays(weekStart, 4))}
          </Typography>
          <Stack gap={0.5}>
            {weekEvents.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </Stack>
        </Stack>
      ))}
    </Stack>
  );
}

function CalendarGridView({ anchor, events }: { anchor: string; events: CalendarEvent[] }) {
  const weeks = [anchor, addDays(anchor, 7)];

  return (
    <Stack gap={2}>
      {weeks.map((weekStart) => (
        <Box
          key={weekStart}
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
            gap: 1,
          }}
        >
          {workWeekDates(weekStart).map((date) => (
            <CalendarCell key={date} date={date} events={events.filter((e) => e.date === date)} />
          ))}
        </Box>
      ))}
    </Stack>
  );
}

const DOT_COLOR: Record<CalendarEvent["status"], string> = {
  Assigned: "--lens-semantic-color-status-notification-text",
  Complete: "--lens-semantic-color-status-success-text",
  Blocked: "--lens-semantic-color-status-error-text",
};

function CalendarCell({ date, events }: { date: string; events: CalendarEvent[] }) {
  const { tokens } = useTheme();
  const isToday = date === todayIso();
  const parsed = new Date(`${date}T00:00:00Z`);

  return (
    <Box
      sx={{
        minHeight: 140,
        border: `1px solid ${tokens.semantic.color.outline.fixed.value}`,
        borderRadius: tokens.semantic.radius.md.value,
        bgcolor: isToday
          ? tokens.semantic.color.surface.variant.value
          : tokens.semantic.color.surface.subtle.value,
        p: 1,
      }}
    >
      <Stack gap={0.75}>
        <Typography
          variant="textSm"
          sx={{
            fontWeight: tokens.semantic.fontWeight.emphasis.value,
            color: isToday
              ? tokens.semantic.color.action.primary.default.value
              : tokens.semantic.color.type.muted.value,
            textTransform: "uppercase",
          }}
        >
          {DAY_LABEL.format(parsed)} {DAY_NUMBER.format(parsed)}
        </Typography>
        <Stack gap={0.5}>
          {events.map((event) => (
            <Stack
              key={event.id}
              component={RouterLink}
              to={event.href}
              direction="row"
              gap={0.5}
              alignItems="flex-start"
              sx={{ textDecoration: "none", color: "inherit" }}
            >
              <Box
                aria-label={event.status}
                sx={{
                  width: 8,
                  height: 8,
                  mt: 0.6,
                  flexShrink: 0,
                  borderRadius: "50%",
                  bgcolor: `var(${DOT_COLOR[event.status]})`,
                }}
              />
              <Typography variant="textSm" sx={{ lineHeight: 1.3 }}>
                {event.title}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Box>
  );
}
