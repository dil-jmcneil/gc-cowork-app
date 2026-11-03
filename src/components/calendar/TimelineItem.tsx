import ProjectsIcon from "@diligentcorp/atlas-react-bundle/icons/Projects";
import { Box, Button, Link, Stack, Tooltip, Typography, useTheme } from "@mui/material";
import { Link as RouterLink } from "react-router";

import type { CalendarEvent } from "@/calendar/complianceEvents";
import { dateTense, temporalBand } from "@/calendar/weeks";
import { SPACE } from "@/lib/layout";

import { DateChip } from "./DateChip";
import { useBandLook } from "./TemporalBands";

/** Tooltip body: what the event opens and Cowork's suggested next step. */
export function EventHoverDetails({ event }: { event: CalendarEvent }) {
  const { tokens } = useTheme();
  return (
    <Stack gap={SPACE.pair} sx={{ py: SPACE.pair }}>
      <Typography variant="textMd" sx={{ fontWeight: tokens.semantic.fontWeight.emphasis.value }}>
        {event.linkLabel}
      </Typography>
      <Typography variant="textMd">Next step: {event.nextStep}</Typography>
    </Stack>
  );
}

/**
 * One timeline row inside a temporal band: a compact date badge, then the
 * status label and title, the workstream, and who owns it with Cowork's line
 * on the latest activity (the same order as the signal cards in chat).
 * Nothing is bold. Rows further out are shaded and faded.
 */
export function TimelineItem({
  event,
  todayIso,
  nudged,
  onNudge,
  onOpen,
}: {
  event: CalendarEvent;
  todayIso: string;
  nudged: boolean;
  onNudge: (event: CalendarEvent) => void;
  onOpen: (event: CalendarEvent) => void;
}) {
  const look = useBandLook(temporalBand(event.date, todayIso));
  return (
    <Stack
      component="li"
      direction="row"
      alignItems="flex-start"
      gap={SPACE.group}
      sx={(theme) => ({
        listStyle: "none",
        px: SPACE.block,
        py: SPACE.group,
        bgcolor: look.rowBg,
        borderTop: `1px solid ${theme.tokens.semantic.color.ui.divider.default.value}`,
        transition: "background-color 120ms ease",
        "&:hover, &:focus-within": { bgcolor: look.rowHoverBg },
      })}
    >
      <DateChip date={event.date} tense={dateTense(event.date, todayIso)} />
      <Stack gap={SPACE.pair} sx={{ flex: 1, minWidth: 0 }}>
        <EventTitle event={event} todayIso={todayIso} onOpen={onOpen} />
        {event.workstream ? <WorkstreamLine workstream={event.workstream} /> : null}
        <OwnerActivity event={event} />
      </Stack>
      <NudgeAction event={event} nudged={nudged} onNudge={onNudge} />
    </Stack>
  );
}

/** Status label, then the title. The title opens the task or signal, when there is one to open. */
export function EventTitle({
  event,
  todayIso,
  onOpen,
  showStatus = true,
}: {
  event: CalendarEvent;
  todayIso: string;
  onOpen: (event: CalendarEvent) => void;
  /** Swimlane cards show the status in their footer instead. */
  showStatus?: boolean;
}) {
  const { tokens, presets } = useTheme();
  const StatusIndicator = presets.StatusIndicatorPresets.components.StatusIndicator;
  const look = useBandLook(temporalBand(event.date, todayIso));
  const done = event.status === "Complete" && event.date < todayIso;
  const color = done
    ? tokens.semantic.color.type.disabled.value
    : look.faded
      ? tokens.semantic.color.type.muted.value
      : tokens.semantic.color.type.default.value;
  /** A past workstream's task has no dialog to open. */
  const openable = event.kind !== "reference";

  return (
    <Stack direction="row" alignItems="center" gap={SPACE.item} flexWrap="wrap" sx={{ minWidth: 0 }}>
      {showStatus ? <StatusIndicator color={event.priority.color} label={event.priority.label} /> : null}
      <Tooltip title={<EventHoverDetails event={event} />} placement="top-start" enterDelay={300}>
        {openable ? (
          <Link
            component="button"
            type="button"
            underline="hover"
            onClick={() => onOpen(event)}
            sx={{ textAlign: "left", color, minWidth: 0 }}
          >
            <Typography variant="body1" component="span" sx={{ color: "inherit" }}>
              {event.title}
            </Typography>
          </Link>
        ) : (
          <Typography variant="body1" tabIndex={0} sx={{ color, minWidth: 0 }}>
            {event.title}
          </Typography>
        )}
      </Tooltip>
    </Stack>
  );
}

/** The workstream, linked when it has a page (past workstreams don't). Regular weight. */
export function WorkstreamLine({ workstream }: { workstream: { name: string; href?: string } }) {
  const { tokens } = useTheme();
  const content = (
    <>
      <ProjectsIcon aria-hidden style={{ width: 16, height: 16, flexShrink: 0 }} />
      <Typography variant="body1" component="span" sx={{ color: "inherit" }}>
        Workstream: {workstream.name}
      </Typography>
    </>
  );
  const sx = { alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: SPACE.pair };
  return workstream.href ? (
    <Link component={RouterLink} to={workstream.href} underline="hover" sx={sx}>
      {content}
    </Link>
  ) : (
    <Box sx={{ ...sx, color: tokens.semantic.color.type.muted.value }}>{content}</Box>
  );
}

/** The owner, in the default color, then Cowork's line on the latest activity, as one sentence. */
export function OwnerActivity({ event, clamp }: { event: CalendarEvent; clamp?: number }) {
  const { tokens } = useTheme();
  return (
    <Typography
      variant="body1"
      sx={{
        color: tokens.semantic.color.type.muted.value,
        ...(clamp
          ? { display: "-webkit-box", WebkitLineClamp: clamp, WebkitBoxOrient: "vertical", overflow: "hidden" }
          : {}),
      }}
    >
      {event.owner ? (
        <Box component="span" sx={{ color: tokens.semantic.color.type.default.value }}>
          {event.owner}
        </Box>
      ) : null}
      {event.owner ? " · " : ""}
      {event.summary}
    </Typography>
  );
}

/** Nudge, for an overdue task. The status label covers every other state. */
export function NudgeAction({
  event,
  nudged,
  onNudge,
}: {
  event: CalendarEvent;
  nudged: boolean;
  onNudge: (event: CalendarEvent) => void;
}) {
  if (event.attention !== "nudge") return null;
  return (
    <Button
      variant="outlined"
      size="xsmall"
      disabled={nudged}
      onClick={() => onNudge(event)}
      aria-label={event.owner ? `Nudge ${event.owner}` : "Nudge"}
      sx={{ flexShrink: 0 }}
    >
      {nudged ? "Nudged" : "Nudge"}
    </Button>
  );
}
