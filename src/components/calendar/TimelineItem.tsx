import ProjectsIcon from "@diligentcorp/atlas-react-bundle/icons/Projects";
import { Avatar, Box, Button, Link, Stack, Tooltip, Typography, useTheme } from "@mui/material";
import { Link as RouterLink } from "react-router";

import type { CalendarEvent, CalendarEventAttention } from "@/calendar/complianceEvents";
import { dateTense } from "@/calendar/weeks";

import { DateChip } from "./DateChip";
import { SPACE } from "@/lib/layout";

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
 * One timeline row: the date, then a status label and the task, who it's
 * assigned to with Cowork's one-line summary of the latest activity, and the
 * workstream it belongs to. Nothing is bold, so the status labels and links
 * carry the emphasis. The title opens the event when it has something to open.
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
  const { tokens, presets } = useTheme();
  const StatusIndicator = presets.StatusIndicatorPresets.components.StatusIndicator;
  const tense = dateTense(event.date, todayIso);
  /** A past workstream's task has no dialog to open. */
  const openable = event.kind !== "reference";
  const settled = tense === "past" && event.status === "Complete";
  const muted = tokens.semantic.color.type.muted.value;
  const titleColor = settled ? tokens.semantic.color.type.disabled.value : tokens.semantic.color.type.default.value;

  return (
    <Stack
      direction="row"
      alignItems="flex-start"
      gap={SPACE.block}
      sx={{
        px: SPACE.block,
        py: SPACE.group,
        transition: "background-color 120ms ease",
        "&:hover, &:focus-within": { bgcolor: tokens.semantic.color.status.neutral.backgroundVariant.value },
      }}
    >
      <DateChip date={event.date} tense={tense} />
      <Stack gap={SPACE.pair} sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" alignItems="center" gap={SPACE.item} flexWrap="wrap">
          <StatusIndicator color={event.priority.color} label={event.priority.label} />
          <Tooltip title={<EventHoverDetails event={event} />} placement="top-start" enterDelay={300}>
            {openable ? (
              <Link
                component="button"
                type="button"
                underline="hover"
                onClick={() => onOpen(event)}
                sx={{ textAlign: "left", color: titleColor }}
              >
                <Typography variant="body1" component="span" sx={{ color: "inherit" }}>
                  {event.title}
                </Typography>
              </Link>
            ) : (
              <Typography variant="body1" tabIndex={0} sx={{ color: titleColor }}>
                {event.title}
              </Typography>
            )}
          </Tooltip>
        </Stack>

        {/* Owner first, in the default color, then Cowork's line on the latest activity; it wraps as one sentence. */}
        <Stack direction="row" alignItems="flex-start" gap={SPACE.item} sx={{ minWidth: 0 }}>
          {event.owner ? (
            <Box sx={{ flexShrink: 0 }}>
              <Avatar {...presets.AvatarPresets.getAvatarProps({ size: "small", color: "blue" })} aria-hidden>
                {initials(event.owner)}
              </Avatar>
            </Box>
          ) : null}
          <Typography variant="body1" sx={{ color: muted, minWidth: 0, pt: event.owner ? "2px" : 0 }}>
            {event.owner ? (
              <Box component="span" sx={{ color: tokens.semantic.color.type.default.value }}>
                {event.owner}
              </Box>
            ) : null}
            {event.owner ? " · " : ""}
            {event.summary}
          </Typography>
        </Stack>

        {event.workstream ? <WorkstreamLine workstream={event.workstream} /> : null}
      </Stack>
      <Box sx={{ flexShrink: 0, display: "flex", justifyContent: "flex-end", pt: SPACE.pair }}>
        <AttentionSlot attention={event.attention} nudged={nudged} owner={event.owner} onNudge={() => onNudge(event)} />
      </Box>
    </Stack>
  );
}

function initials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

/** The workstream, linked when it has a page (past workstreams don't). Regular weight, like the rest of the row. */
function WorkstreamLine({ workstream }: { workstream: { name: string; href?: string } }) {
  const { tokens } = useTheme();
  const content = (
    <>
      <ProjectsIcon aria-hidden style={{ width: 16, height: 16 }} />
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

function AttentionSlot({
  attention,
  nudged,
  owner,
  onNudge,
}: {
  attention?: CalendarEventAttention;
  nudged: boolean;
  owner?: string;
  onNudge: () => void;
}) {
  if (!attention) return null;

  if (attention === "nudge") {
    return (
      <Button
        variant="outlined"
        size="xsmall"
        disabled={nudged}
        onClick={onNudge}
        aria-label={owner ? `Nudge ${owner}` : "Nudge"}
      >
        {nudged ? "Nudged" : "Nudge"}
      </Button>
    );
  }

  // "New status" and "Awaiting your response" are covered by the status label (In progress, Due soon, Needs a workstream).
  return null;
}
