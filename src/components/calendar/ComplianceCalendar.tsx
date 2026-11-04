import { Alert, Box, Link, Snackbar, Stack, Typography, useTheme } from "@mui/material";
import { useMemo, useState, type ReactNode } from "react";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router";

import { deriveCalendarEvents, type CalendarEvent } from "@/calendar/complianceEvents";
import {
  addDays,
  addMonths,
  formatDateRange,
  formatMonthYear,
  monthGridDates,
  BAND_LABEL,
  startOfMonth,
  startOfWeek,
  temporalBand,
  workWeekDates,
  type TemporalBand,
} from "@/calendar/weeks";
import { SignalDialog } from "@/components/home/SignalDialog";
import { TaskQuickView, type TaskRef } from "@/components/tasks/TaskQuickView";
import { useMvpScopeStore } from "@/demo/mvpScopeStore";
import { useWorkstreamStore } from "@/workstreams/workstreamStore";
import { SIGNALS } from "@/signals/signals";

import { CalendarCell } from "./CalendarCell";
import { CalendarViewToggle, type CalendarView } from "./CalendarViewToggle";
import { CalendarLegend } from "./StatusDot";
import { TimeSelector } from "./TimeSelector";
import { SwimlaneBoard } from "./SwimlaneBoard";
import { BandHeader, useBandLook } from "./TemporalBands";
import { TimelineItem } from "./TimelineItem";
import { SPACE } from "@/lib/layout";

/** "widget": the Figma home-page block (weeks, Mon–Fri). "page": a full month calendar with weekends. */
export type ComplianceCalendarVariant = "widget" | "page";

const DESCRIPTION =
  "One timeline for you and your team. Hover an event to see what it links to and the suggested next steps.";

/** Widget Timeline shows five weeks; widget Calendar shows two Mon–Fri weeks, as in Figma. */
const WIDGET_TIMELINE_WEEKS = 5;
const WIDGET_CALENDAR_WEEKS = 2;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

type Range = { start: string; end: string; label: string; step: (anchor: string, dir: 1 | -1) => string };

function rangeFor(variant: ComplianceCalendarVariant, view: CalendarView, anchor: string): Range {
  if (variant === "page") {
    const start = startOfMonth(anchor);
    return {
      start,
      end: addDays(addMonths(start, 1), -1),
      label: formatMonthYear(start),
      step: (a, dir) => addMonths(a, dir),
    };
  }
  const weeks = view === "calendar" ? WIDGET_CALENDAR_WEEKS : WIDGET_TIMELINE_WEEKS;
  const start = startOfWeek(anchor);
  const end = addDays(start, weeks * 7 - 3); // ends on a Friday
  return {
    start,
    end,
    label: formatDateRange(start, end),
    step: (a, dir) => addDays(startOfWeek(a), dir * weeks * 7),
  };
}

export function ComplianceCalendar({
  variant,
  headerAction,
}: {
  variant: ComplianceCalendarVariant;
  /** Extra control at the right of the header, e.g. a link to the full calendar. */
  headerAction?: ReactNode;
}) {
  const { tokens } = useTheme();
  const workstreams = useWorkstreamStore((s) => s.workstreams);
  const today = todayIso();
  const events = useMemo(() => deriveCalendarEvents(workstreams, new Date()), [workstreams]);

  const [searchParams] = useSearchParams();
  // "View on calendar" links pass ?date= so the page opens on that month.
  const linkedDate = variant === "page" ? searchParams.get("date") : null;
  const [view, setView] = useState<CalendarView>(variant === "page" ? "calendar" : "timeline");
  const [anchor, setAnchor] = useState(linkedDate && /^\d{4}-\d{2}-\d{2}$/.test(linkedDate) ? linkedDate : today);
  const [nudged, setNudged] = useState<Set<string>>(() => new Set());
  const [toast, setToast] = useState<string | null>(null);
  const [openTask, setOpenTask] = useState<TaskRef | null>(null);
  const [openSignalId, setOpenSignalId] = useState<string | null>(null);
  const showPostMvpViews = useMvpScopeStore((s) => s.showPostMvpViews);
  const navigate = useNavigate();
  const nudgeTask = useWorkstreamStore((s) => s.nudgeTask);

  const range = rangeFor(variant, view, anchor);
  const inRange = events.filter((e) => e.date >= range.start && e.date <= range.end);
  const unit = variant === "page" ? "month" : view === "calendar" ? "two weeks" : "five weeks";

  const handleNudge = (event: CalendarEvent) => {
    if (event.kind === "task") nudgeTask(event.workstreamId, event.taskId);
    setNudged((prev) => new Set(prev).add(event.id));
    setToast(event.owner ? `Nudge sent to ${event.owner}.` : "Nudge sent.");
  };

  /**
   * MVP: every event opens its workstream page on the task, or the
   * signal's draft when it has none. With post-MVP views on, tasks open the
   * task quick view and deadlines open their signal, as before.
   */
  const handleOpen = (event: CalendarEvent) => {
    if (!showPostMvpViews) {
      if (event.href) navigate(event.href);
      return;
    }
    if (event.kind === "task") setOpenTask({ workstreamId: event.workstreamId, taskId: event.taskId });
    else setOpenSignalId(event.signalId);
  };

  return (
    <Stack gap={SPACE.block} component="section" aria-labelledby={`compliance-calendar-${variant}`}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={SPACE.block}>
        <Stack gap={SPACE.pair}>
          <Typography
            id={`compliance-calendar-${variant}`}
            variant={variant === "page" ? "h4" : "h6"}
            component={variant === "page" ? "h1" : "h2"}
            sx={{ fontWeight: tokens.semantic.fontWeight.emphasis.value }}
          >
            Compliance Calendar
          </Typography>
          <Typography variant="textMd" sx={{ color: tokens.semantic.color.type.muted.value }}>
            {DESCRIPTION}
          </Typography>
        </Stack>
        {headerAction}
      </Stack>

      <Box>
        <CalendarViewToggle value={view} onChange={setView} />
      </Box>

      <Box
        sx={{
          bgcolor: tokens.semantic.color.surface.default.value,
          border: `1px solid ${tokens.semantic.color.action.secondary.outlineDisabled.value}`,
          borderRadius: tokens.semantic.radius.lg.value,
          py: SPACE.block,
          overflow: "hidden",
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
          gap={SPACE.group}
          sx={{ px: SPACE.block }}
        >
          <TimeSelector
            label={range.label}
            onPrevious={() => setAnchor((a) => range.step(a, -1))}
            onNext={() => setAnchor((a) => range.step(a, 1))}
            onToday={() => setAnchor(today)}
            previousLabel={`Previous ${unit}`}
            nextLabel={`Next ${unit}`}
          />
          {/* Timeline and the month grid use dots; the swimlane spells statuses out, so it needs no legend. */}
          {view === "swimlane" ? null : <CalendarLegend />}
        </Stack>

        <Box sx={{ pt: SPACE.group }}>
          {view === "timeline" ? (
            <TimelineBody events={inRange} todayIso={today} nudged={nudged} onNudge={handleNudge} onOpen={handleOpen} />
          ) : view === "swimlane" ? (
            <SwimlaneBoard
              events={inRange}
              todayIso={today}
              nudged={nudged}
              onNudge={handleNudge}
              onOpen={handleOpen}
            />
          ) : variant === "page" ? (
            <MonthGrid monthStart={range.start} events={events} todayIso={today} onOpen={handleOpen} />
          ) : (
            <WeekdayGrid start={range.start} events={events} todayIso={today} onOpen={handleOpen} />
          )}
        </Box>
      </Box>

      <TaskQuickView
        taskRef={openTask}
        onClose={() => setOpenTask(null)}
        onNudge={(owner) => setToast(`Nudge sent to ${owner}.`)}
      />
      <SignalDialog signal={SIGNALS.find((c) => c.id === openSignalId) ?? null} onClose={() => setOpenSignalId(null)} />

      <Snackbar open={toast !== null} autoHideDuration={5000} onClose={() => setToast(null)}>
        <Alert severity="success" aria-live="polite" onClose={() => setToast(null)}>
          {toast}
        </Alert>
      </Snackbar>
    </Stack>
  );
}

/** Timeline view: events grouped into temporal bands, each with its accent, tinted header and divided rows. */
function TimelineBody({
  events,
  todayIso,
  nudged,
  onNudge,
  onOpen,
}: {
  events: CalendarEvent[];
  todayIso: string;
  nudged: Set<string>;
  onNudge: (event: CalendarEvent) => void;
  onOpen: (event: CalendarEvent) => void;
}) {
  const { tokens } = useTheme();
  const bands = useMemo(() => {
    const ordered: [TemporalBand, CalendarEvent[]][] = [];
    for (const event of events) {
      const band = temporalBand(event.date, todayIso);
      const last = ordered[ordered.length - 1];
      if (last && last[0] === band) last[1].push(event);
      else ordered.push([band, [event]]);
    }
    return ordered;
  }, [events, todayIso]);

  if (bands.length === 0) {
    return (
      <Typography
        variant="body1"
        sx={{ color: tokens.semantic.color.type.muted.value, px: SPACE.block, py: SPACE.block }}
      >
        Nothing due in this range.
      </Typography>
    );
  }

  return (
    <Stack>
      {bands.map(([band, bandEvents]) => (
        <TimelineBand
          key={band}
          band={band}
          events={bandEvents}
          todayIso={todayIso}
          nudged={nudged}
          onNudge={onNudge}
          onOpen={onOpen}
        />
      ))}
    </Stack>
  );
}

function TimelineBand({
  band,
  events,
  todayIso,
  nudged,
  onNudge,
  onOpen,
}: {
  band: TemporalBand;
  events: CalendarEvent[];
  todayIso: string;
  nudged: Set<string>;
  onNudge: (event: CalendarEvent) => void;
  onOpen: (event: CalendarEvent) => void;
}) {
  const { tokens } = useTheme();
  const look = useBandLook(band);
  return (
    <Box
      component="section"
      aria-label={BAND_LABEL[band]}
      sx={{
        borderLeft: `3px solid ${look.accent}`,
        borderTop: `1px solid ${tokens.semantic.color.ui.divider.default.value}`,
      }}
    >
      <BandHeader band={band} count={events.length} todayIso={todayIso} />
      <Box component="ul" sx={{ m: 0, p: 0 }}>
        {events.map((event) => (
          <TimelineItem
            key={event.id}
            event={event}
            todayIso={todayIso}
            nudged={nudged.has(event.id)}
            onNudge={onNudge}
            onOpen={onOpen}
          />
        ))}
      </Box>
    </Box>
  );
}

function eventsOn(events: CalendarEvent[], date: string) {
  return events.filter((e) => e.date === date);
}

/** Figma Calendar view: Mon–Fri cells for each week in range. */
function WeekdayGrid({
  start,
  events,
  todayIso,
  onOpen,
}: {
  start: string;
  events: CalendarEvent[];
  todayIso: string;
  onOpen: (event: CalendarEvent) => void;
}) {
  const weeks = Array.from({ length: WIDGET_CALENDAR_WEEKS }, (_, i) => addDays(start, i * 7));
  return (
    <Stack gap={SPACE.item} sx={{ px: SPACE.block }}>
      {weeks.map((week, weekIndex) => (
        <Box key={week} sx={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: SPACE.item }}>
          {workWeekDates(week).map((date, dayIndex) => (
            <CalendarCell
              key={date}
              date={date}
              events={eventsOn(events, date)}
              todayIso={todayIso}
              showMonth={(weekIndex === 0 && dayIndex === 0) || date.endsWith("-01")}
              onOpen={onOpen}
            />
          ))}
        </Box>
      ))}
    </Stack>
  );
}

const WEEKDAY_HEADINGS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Full-page month view: Monday-to-Sunday weeks, neighbouring-month days dimmed. */
function MonthGrid({
  monthStart,
  events,
  todayIso,
  onOpen,
}: {
  monthStart: string;
  events: CalendarEvent[];
  todayIso: string;
  onOpen: (event: CalendarEvent) => void;
}) {
  const { tokens } = useTheme();
  const dates = monthGridDates(monthStart);
  const month = monthStart.slice(0, 7);
  const columns = "repeat(5, minmax(0, 1.25fr)) repeat(2, minmax(0, 1fr))";

  return (
    <Stack gap={SPACE.item} sx={{ px: SPACE.block }}>
      <Box sx={{ display: "grid", gridTemplateColumns: columns, gap: SPACE.item }} aria-hidden>
        {WEEKDAY_HEADINGS.map((day) => (
          <Typography
            key={day}
            variant="textMd"
            sx={{
              px: SPACE.item,
              color: tokens.semantic.color.type.muted.value,
              fontWeight: tokens.semantic.fontWeight.emphasis.value,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {day}
          </Typography>
        ))}
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: columns, gap: SPACE.item }}>
        {dates.map((date) => (
          <CalendarCell
            key={date}
            date={date}
            events={eventsOn(events, date)}
            todayIso={todayIso}
            showMonth={date.endsWith("-01")}
            outsideMonth={!date.startsWith(month)}
            minHeight={128}
            maxEvents={3}
            showWeekday={false}
            onOpen={onOpen}
          />
        ))}
      </Box>
    </Stack>
  );
}

/** Header link from the home widget to the full calendar page. */
export function FullCalendarLink() {
  return (
    <Link
      component={RouterLink}
      to="/compliance-calendar"
      underline="hover"
      sx={{ whiteSpace: "nowrap", pt: SPACE.pair }}
    >
      <Typography variant="body1" sx={{ color: "inherit" }}>
        Open full calendar
      </Typography>
    </Link>
  );
}
