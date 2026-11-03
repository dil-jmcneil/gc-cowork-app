import { Box, Card, CardContent, Stack, Typography, useTheme } from "@mui/material";

import type { CalendarEvent } from "@/calendar/complianceEvents";
import { BAND_LABEL, bandDates, temporalBand, type TemporalBand } from "@/calendar/weeks";
import { SPACE } from "@/lib/layout";

import { useBandLook } from "./TemporalBands";
import { EventTitle, NudgeAction, OwnerActivity, WorkstreamLine } from "./TimelineItem";

const LANES: TemporalBand[] = ["this-week", "next-week", "further"];

const SHORT_DATE = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

/**
 * "Swimlane Columns" view: This Week, Next Week and Further Out side by side,
 * one compact card per event. Open items from earlier weeks stay in This Week
 * so overdue work doesn't drop out of sight; finished earlier items are left out.
 */
export function SwimlaneBoard({
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
  const lanes: Record<TemporalBand, CalendarEvent[]> = { earlier: [], "this-week": [], "next-week": [], further: [] };
  for (const event of events) {
    const band = temporalBand(event.date, todayIso);
    if (band === "earlier") {
      if (event.status !== "Complete") lanes["this-week"].push(event);
    } else lanes[band].push(event);
  }

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
        borderTop: `1px solid ${tokens.semantic.color.ui.divider.default.value}`,
      }}
    >
      {LANES.map((band, index) => (
        <Lane
          key={band}
          band={band}
          events={lanes[band]}
          todayIso={todayIso}
          last={index === LANES.length - 1}
          nudged={nudged}
          onNudge={onNudge}
          onOpen={onOpen}
        />
      ))}
    </Box>
  );
}

function Lane({
  band,
  events,
  todayIso,
  last,
  nudged,
  onNudge,
  onOpen,
}: {
  band: TemporalBand;
  events: CalendarEvent[];
  todayIso: string;
  last: boolean;
  nudged: Set<string>;
  onNudge: (event: CalendarEvent) => void;
  onOpen: (event: CalendarEvent) => void;
}) {
  const { tokens } = useTheme();
  const look = useBandLook(band);
  const divider = tokens.semantic.color.ui.divider.default.value;
  const headingId = `lane-${band}`;

  return (
    <Box
      component="section"
      aria-labelledby={headingId}
      sx={{ borderRight: last ? "none" : `1px solid ${divider}`, minWidth: 0 }}
    >
      <Stack
        gap={SPACE.pair}
        sx={{
          px: SPACE.block,
          py: SPACE.group,
          bgcolor: look.headerBg,
          borderTop: `3px solid ${look.accent}`,
          borderBottom: `1px solid ${divider}`,
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={SPACE.item}>
          <Typography
            id={headingId}
            component="h3"
            variant="body1"
            sx={{ color: look.label, fontWeight: tokens.semantic.fontWeight.emphasis.value }}
          >
            {BAND_LABEL[band]}
          </Typography>
          <Typography variant="textMd" sx={{ color: look.label }}>
            {events.length} {events.length === 1 ? "item" : "items"}
          </Typography>
        </Stack>
        <Typography variant="textMd" sx={{ color: tokens.semantic.color.type.muted.value }}>
          {bandDates(band, todayIso)}
        </Typography>
      </Stack>

      <Stack component="ul" gap={SPACE.item} sx={{ listStyle: "none", m: 0, p: SPACE.group }}>
        {events.length === 0 ? (
          <Typography component="li" variant="body1" sx={{ color: tokens.semantic.color.type.muted.value }}>
            Nothing due.
          </Typography>
        ) : (
          events.map((event) => (
            <SwimCard
              key={event.id}
              event={event}
              todayIso={todayIso}
              shaded={look.faded}
              nudged={nudged.has(event.id)}
              onNudge={onNudge}
              onOpen={onOpen}
            />
          ))
        )}
      </Stack>
    </Box>
  );
}

/** A compact card: date pill and title, the workstream, the owner and latest activity, then status and Nudge. */
function SwimCard({
  event,
  todayIso,
  shaded,
  nudged,
  onNudge,
  onOpen,
}: {
  event: CalendarEvent;
  todayIso: string;
  shaded: boolean;
  nudged: boolean;
  onNudge: (event: CalendarEvent) => void;
  onOpen: (event: CalendarEvent) => void;
}) {
  const { tokens, presets } = useTheme();
  const StatusIndicator = presets.StatusIndicatorPresets.components.StatusIndicator;
  return (
    <Card
      component="li"
      variant="outlined"
      sx={{ p: 0, listStyle: "none", bgcolor: shaded ? tokens.semantic.color.surface.subtle.value : undefined }}
    >
      <CardContent sx={{ p: SPACE.group, "&:last-child": { pb: SPACE.group } }}>
        <Stack gap={SPACE.item}>
          <Stack direction="row" alignItems="flex-start" gap={SPACE.item}>
            <Box
              component="span"
              sx={{
                flexShrink: 0,
                px: SPACE.pair,
                borderRadius: tokens.semantic.radius.sm.value,
                bgcolor: tokens.semantic.color.surface.variant.value,
                mt: "2px",
              }}
            >
              <Typography variant="textMd" sx={{ color: tokens.semantic.color.type.muted.value, whiteSpace: "nowrap" }}>
                {SHORT_DATE.format(new Date(`${event.date}T00:00:00Z`))}
              </Typography>
            </Box>
            <EventTitle event={event} todayIso={todayIso} onOpen={onOpen} showStatus={false} />
          </Stack>
          {event.workstream ? (
            <WorkstreamLine workstream={event.workstream} onOpenSignal={() => onOpen(event)} />
          ) : null}
          <OwnerActivity event={event} clamp={2} />
          <Stack direction="row" alignItems="center" justifyContent="space-between" gap={SPACE.item}>
            <StatusIndicator color={event.priority.color} label={event.priority.label} />
            <NudgeAction event={event} nudged={nudged} onNudge={onNudge} />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
