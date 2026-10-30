import { Box, Button, Stack, Tooltip, Typography, useTheme } from "@mui/material";

import type { CalendarEvent, CalendarEventAttention } from "@/calendar/complianceEvents";
import { dateTense } from "@/calendar/weeks";

import { DateChip } from "./DateChip";
import { StatusDot } from "./StatusDot";

/** Tooltip body: what the event opens and Cowork's suggested next step. */
export function EventHoverDetails({ event }: { event: CalendarEvent }) {
  const { tokens } = useTheme();
  return (
    <Stack gap={0.5} sx={{ py: 0.25 }}>
      <Typography variant="textSm" sx={{ fontWeight: tokens.semantic.fontWeight.emphasis.value }}>
        {event.linkLabel}
      </Typography>
      <Typography variant="textSm">Next step: {event.nextStep}</Typography>
    </Stack>
  );
}

/** Figma TimelineItem: date chip, status dot, title and summary, and the Attention slot. */
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
  const { tokens } = useTheme();
  const tense = dateTense(event.date, todayIso);
  const settled = tense === "past" && event.status === "Complete";
  const titleColor = settled ? tokens.semantic.color.type.disabled.value : tokens.semantic.color.type.default.value;
  const bodyColor = settled ? tokens.semantic.color.type.disabled.value : tokens.semantic.color.type.muted.value;

  return (
    <Stack
      direction="row"
      alignItems="center"
      gap={2}
      sx={{
        px: 2,
        py: 1,
        transition: "background-color 120ms ease",
        "&:hover, &:focus-within": { bgcolor: tokens.semantic.color.status.neutral.backgroundVariant.value },
      }}
    >
      <Tooltip title={<EventHoverDetails event={event} />} placement="top-start" enterDelay={300}>
        <Stack
          component="button"
          type="button"
          onClick={() => onOpen(event)}
          direction="row"
          alignItems="center"
          gap={2}
          sx={{
            flex: 1,
            minWidth: 0,
            p: 0,
            border: "none",
            bgcolor: "transparent",
            font: "inherit",
            textAlign: "left",
            cursor: "pointer",
            color: "inherit",
            outlineOffset: 2,
          }}
        >
          <DateChip date={event.date} tense={tense} />
          <StatusDot status={event.status} />
          <Stack sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="textMd"
              sx={{ color: titleColor, fontWeight: tokens.semantic.fontWeight.emphasis.value }}
            >
              {event.title}
            </Typography>
            <Typography variant="textMd" sx={{ color: bodyColor }}>
              {event.description}
            </Typography>
          </Stack>
        </Stack>
      </Tooltip>
      <Box sx={{ width: 190, flexShrink: 0, display: "flex", justifyContent: "flex-end" }}>
        <AttentionSlot
          attention={event.attention}
          nudged={nudged}
          owner={event.owner}
          onNudge={() => onNudge(event)}
        />
      </Box>
    </Stack>
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
  const { tokens } = useTheme();
  const accent = tokens.semantic.color.accent;
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

  const badge =
    attention === "new-status"
      ? { label: "New status", bg: accent.blue.background.value, fg: accent.blue.content.value }
      : { label: "Awaiting your response", bg: accent.yellow.background.value, fg: accent.yellow.content.value };

  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        height: 24,
        px: 1,
        borderRadius: tokens.semantic.radius.full.value,
        bgcolor: badge.bg,
        color: badge.fg,
        whiteSpace: "nowrap",
      }}
    >
      <Typography variant="textSm" sx={{ color: "inherit", fontWeight: tokens.semantic.fontWeight.emphasis.value }}>
        {badge.label}
      </Typography>
    </Box>
  );
}
