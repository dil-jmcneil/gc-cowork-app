import { Alert, Box, Link, Snackbar, Stack, Typography, useTheme } from "@mui/material";
import { useMemo, useState, type ReactNode } from "react";
import { Link as RouterLink, useSearchParams } from "react-router";

import { deriveCalendarEvents, type CalendarEvent } from "@/calendar/complianceEvents";
import {
  addDays,
  addMonths,
  formatDateRange,
  formatMonthYear,
  monthGridDates,
  relativeBucket,
  startOfMonth,
  startOfWeek,
  workWeekDates,
} from "@/calendar/weeks";
import { RegulatoryChangeDialog } from "@/components/home/RegulatoryChangeDialog";
import { TaskQuickView, type TaskRef } from "@/components/tasks/TaskQuickView";
import { useProjectStore } from "@/projects/projectStore";
import { REGULATORY_CHANGES } from "@/regulatory/regulatoryChanges";

import { CalendarCell } from "./CalendarCell";
import { CalendarViewToggle, type CalendarView } from "./CalendarViewToggle";
import { CalendarLegend } from "./StatusDot";
import { TimeSelector } from "./TimeSelector";
import { TimelineItem } from "./TimelineItem";

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
  const weeks = view === "timeline" ? WIDGET_TIMELINE_WEEKS : WIDGET_CALENDAR_WEEKS;
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
  const projects = useProjectStore((s) => s.projects);
  const today = todayIso();
  const events = useMemo(() => deriveCalendarEvents(projects, new Date()), [projects]);

  const [searchParams] = useSearchParams();
  // "View on calendar" links pass ?date= so the page opens on that month.
  const linkedDate = variant === "page" ? searchParams.get("date") : null;
  const [view, setView] = useState<CalendarView>(variant === "page" ? "calendar" : "timeline");
  const [anchor, setAnchor] = useState(linkedDate && /^\d{4}-\d{2}-\d{2}$/.test(linkedDate) ? linkedDate : today);
  const [nudged, setNudged] = useState<Set<string>>(() => new Set());
  const [toast, setToast] = useState<string | null>(null);
  const [openTask, setOpenTask] = useState<TaskRef | null>(null);
  const [openChangeId, setOpenChangeId] = useState<string | null>(null);
  const nudgeTask = useProjectStore((s) => s.nudgeTask);

  const range = rangeFor(variant, view, anchor);
  const inRange = events.filter((e) => e.date >= range.start && e.date <= range.end);
  const unit = variant === "page" ? "month" : view === "timeline" ? "five weeks" : "two weeks";

  const handleNudge = (event: CalendarEvent) => {
    if (event.kind === "task") nudgeTask(event.projectId, event.taskId);
    setNudged((prev) => new Set(prev).add(event.id));
    setToast(event.owner ? `Nudge sent to ${event.owner}.` : "Nudge sent.");
  };

  /** Tasks open the task quick view; external deadlines open their regulatory change. */
  const handleOpen = (event: CalendarEvent) => {
    if (event.kind === "task") setOpenTask({ projectId: event.projectId, taskId: event.taskId });
    else setOpenChangeId(event.changeId);
  };

  return (
    <Stack gap={2} component="section" aria-labelledby={`compliance-calendar-${variant}`}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={2}>
        <Stack gap={0.5}>
          <Typography
            id={`compliance-calendar-${variant}`}
            variant={variant === "page" ? "h4" : "h5"}
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
          py: 2,
          overflow: "hidden",
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
          gap={1.5}
          sx={{ px: 2 }}
        >
          <TimeSelector
            label={range.label}
            onPrevious={() => setAnchor((a) => range.step(a, -1))}
            onNext={() => setAnchor((a) => range.step(a, 1))}
            onToday={() => setAnchor(today)}
            previousLabel={`Previous ${unit}`}
            nextLabel={`Next ${unit}`}
          />
          <CalendarLegend />
        </Stack>

        <Box sx={{ pt: 1.5 }}>
          {view === "timeline" ? (
            <TimelineBody
              events={inRange}
              todayIso={today}
              groupBy={variant === "page" ? weekHeading(today) : (date) => relativeBucket(date, today)}
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
      <RegulatoryChangeDialog
        change={REGULATORY_CHANGES.find((c) => c.id === openChangeId) ?? null}
        onClose={() => setOpenChangeId(null)}
      />

      <Snackbar open={toast !== null} autoHideDuration={5000} onClose={() => setToast(null)}>
        <Alert severity="success" aria-live="polite" onClose={() => setToast(null)}>
          {toast}
        </Alert>
      </Snackbar>
    </Stack>
  );
}

/** Page timeline headings: "This week", otherwise the week's date range. */
function weekHeading(today: string) {
  return (date: string) => {
    const week = startOfWeek(date);
    if (week === startOfWeek(today)) return "This week";
    return formatDateRange(week, addDays(week, 6));
  };
}

function TimelineBody({
  events,
  todayIso,
  groupBy,
  nudged,
  onNudge,
  onOpen,
}: {
  events: CalendarEvent[];
  todayIso: string;
  groupBy: (date: string) => string;
  nudged: Set<string>;
  onNudge: (event: CalendarEvent) => void;
  onOpen: (event: CalendarEvent) => void;
}) {
  const { tokens } = useTheme();
  const groups = useMemo(() => {
    const ordered: [string, CalendarEvent[]][] = [];
    for (const event of events) {
      const heading = groupBy(event.date);
      const last = ordered[ordered.length - 1];
      if (last && last[0] === heading) last[1].push(event);
      else ordered.push([heading, [event]]);
    }
    return ordered;
  }, [events, groupBy]);

  if (groups.length === 0) {
    return (
      <Typography variant="textMd" sx={{ color: tokens.semantic.color.type.muted.value, px: 2, py: 2 }}>
        Nothing due in this range.
      </Typography>
    );
  }

  return (
    <Stack>
      {groups.map(([heading, groupEvents]) => (
        <Box key={heading} component="section" aria-label={heading}>
          <Typography
            component="h3"
            variant="textSm"
            sx={{
              px: 2,
              pt: 1,
              pb: 1,
              color: tokens.semantic.color.type.muted.value,
              fontWeight: tokens.semantic.fontWeight.emphasis.value,
              letterSpacing: "0.5px",
              textTransform: "uppercase",
            }}
          >
            {heading}
          </Typography>
          {groupEvents.map((event) => (
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
      ))}
    </Stack>
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
    <Stack gap={1} sx={{ px: 2 }}>
      {weeks.map((week, weekIndex) => (
        <Box key={week} sx={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 1 }}>
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
    <Stack gap={1} sx={{ px: 2 }}>
      <Box sx={{ display: "grid", gridTemplateColumns: columns, gap: 1 }} aria-hidden>
        {WEEKDAY_HEADINGS.map((day) => (
          <Typography
            key={day}
            variant="textSm"
            sx={{
              px: 1,
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
      <Box sx={{ display: "grid", gridTemplateColumns: columns, gap: 1 }}>
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
    <Link component={RouterLink} to="/compliance-calendar" underline="hover" sx={{ whiteSpace: "nowrap", pt: 0.5 }}>
      <Typography variant="textMd" sx={{ color: "inherit" }}>
        Open full calendar
      </Typography>
    </Link>
  );
}
