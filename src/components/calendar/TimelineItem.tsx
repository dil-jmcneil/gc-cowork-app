import { Box, Button, Link, Stack, Tooltip, Typography, useTheme } from "@mui/material";
import type { ReactNode } from "react";
import { Link as RouterLink } from "react-router";

import type { CalendarEvent } from "@/calendar/complianceEvents";
import { dateTense, temporalBand } from "@/calendar/weeks";
import { SPACE } from "@/lib/layout";

import { DateChip } from "./DateChip";
import { StatusDot } from "./StatusDot";
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
 * One timeline row inside a temporal band, after the Temporal Bands iteration:
 * a compact date badge and status dot, then a 16px title, the workstream, and
 * who owns it with Cowork's line on the latest activity (the same order as the
 * signal cards in chat). Nudge sits at the end of that line when it's due.
 * Everything is centered vertically; rows further out are shaded and faded.
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
      alignItems="center"
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
      <StatusDot status={event.status} />
      <Stack gap={SPACE.pair} sx={{ flex: 1, minWidth: 0 }}>
        <EventTitle event={event} todayIso={todayIso} onOpen={onOpen} showStatus={false} prominent />
        {event.workstream ? <WorkstreamLine workstream={event.workstream} onOpenSignal={() => onOpen(event)} /> : null}
        <OwnerActivity
          event={event}
          action={
            event.attention === "nudge" ? <NudgeAction event={event} nudged={nudged} onNudge={onNudge} /> : undefined
          }
        />
      </Stack>
    </Stack>
  );
}

/** Status label, then the title. The title opens the task or signal, when there is one to open. */
export function EventTitle({
  event,
  todayIso,
  onOpen,
  showStatus = true,
  prominent = false,
}: {
  event: CalendarEvent;
  todayIso: string;
  onOpen: (event: CalendarEvent) => void;
  /** Swimlane cards show the status in their footer instead. */
  showStatus?: boolean;
  /** 16px emphasized, for timeline rows. */
  prominent?: boolean;
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
  const titleVariant = prominent ? "h5" : "body1";
  const titleWeight = prominent ? tokens.semantic.fontWeight.emphasis.value : undefined;

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
            <Typography variant={titleVariant} component="span" sx={{ color: "inherit", fontWeight: titleWeight }}>
              {event.title}
            </Typography>
          </Link>
        ) : (
          <Typography variant={titleVariant} tabIndex={0} sx={{ color, minWidth: 0, fontWeight: titleWeight }}>
            {event.title}
          </Typography>
        )}
      </Tooltip>
    </Stack>
  );
}

/**
 * "Workstream:" in muted text, then the workstream's name as a blue link, with
 * no icon. A workstream with a page links there; a past one (no page) opens
 * its signal instead.
 */
export function WorkstreamLine({
  workstream,
  onOpenSignal,
}: {
  workstream: { name: string; href?: string };
  onOpenSignal?: () => void;
}) {
  const { tokens } = useTheme();
  const name = (
    <Typography variant="body1" component="span" sx={{ color: "inherit" }}>
      {workstream.name}
    </Typography>
  );
  return (
    <Stack direction="row" alignItems="baseline" gap={SPACE.pair} sx={{ alignSelf: "flex-start", minWidth: 0 }}>
      <Typography variant="body1" sx={{ color: tokens.semantic.color.type.muted.value, flexShrink: 0 }}>
        Workstream:
      </Typography>
      {workstream.href ? (
        <Link component={RouterLink} to={workstream.href} underline="hover">
          {name}
        </Link>
      ) : (
        <Link component="button" type="button" underline="hover" onClick={onOpenSignal} sx={{ textAlign: "left" }}>
          {name}
        </Link>
      )}
    </Stack>
  );
}

/** The owner, in the default color, then Cowork's line on the latest activity, as one sentence. */
export function OwnerActivity({
  event,
  clamp,
  action,
}: {
  event: CalendarEvent;
  clamp?: number;
  /** Shown right after the summary, e.g. Nudge when it says one is recommended. */
  action?: ReactNode;
}) {
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
      {action ? (
        <Box component="span" sx={{ display: "inline-flex", verticalAlign: "middle", ml: SPACE.item }}>
          {action}
        </Box>
      ) : null}
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
