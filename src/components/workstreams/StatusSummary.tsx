import { Box, Button, Stack, Typography, useTheme } from "@mui/material";
import { useState } from "react";

import { SPACE } from "@/lib/layout";
import type { Summary } from "@/workstreams/summary";
import type { AttentionItem, SummaryTone } from "@/workstreams/workstreamAttention";

/**
 * The workstream's status summary, styled to stand apart from the cards below
 * it: a tinted panel with an accent bar, in yellow when a step waits on you,
 * red when something blocks the work, and blue otherwise. The bold headline answers on its own
 * (your next action, when there is one), then one or two supporting sentences,
 * then what's waiting on you and on others, each with the action that clears it.
 */
export function StatusSummary({
  label = "Status Summary",
  tone = "information",
  summary,
  waitingOnYou = [],
  waitingOnOthers = [],
  nudged,
  onConfirm,
  onNudge,
}: {
  /** The panel's heading: "Status Summary" for a started workstream, "Summary" for a draft. */
  label?: string;
  /** Atlas status color: warning when a step waits on you, error when something blocks the work. */
  tone?: SummaryTone;
  summary: Summary;
  waitingOnYou?: AttentionItem[];
  waitingOnOthers?: AttentionItem[];
  /** Task ids nudged on this visit; their button reads "Nudged". */
  nudged?: Set<string>;
  onConfirm?: (item: AttentionItem) => void;
  onNudge?: (item: AttentionItem) => void;
}) {
  const { tokens } = useTheme();
  const info = tokens.component.statusIndicator.colors[tone];

  return (
    <Box
      component="section"
      aria-labelledby="status-summary-heading"
      sx={{
        bgcolor: info.backgroundColor.value,
        borderLeft: `4px solid ${info.color.value}`,
        borderRadius: tokens.semantic.radius.lg.value,
        px: SPACE.section,
        py: SPACE.block,
      }}
    >
      <Stack gap={SPACE.group}>
        <Stack gap={SPACE.pair}>
          <Typography
            id="status-summary-heading"
            variant="textMd"
            component="h2"
            sx={{ color: info.color.value, fontWeight: tokens.semantic.fontWeight.emphasis.value }}
          >
            {label}
          </Typography>
          <Typography variant="h5" component="p" sx={{ fontWeight: tokens.semantic.fontWeight.emphasis.value }}>
            {summary.headline}
          </Typography>
          {summary.support.length ? <Typography variant="body1">{summary.support.join(" ")}</Typography> : null}
        </Stack>

        {waitingOnYou.length ? (
          <AttentionGroup
            label="Waiting on you"
            items={waitingOnYou}
            renderAction={(item) => (
              <Button
                variant="contained"
                size="xsmall"
                onClick={() => onConfirm?.(item)}
                aria-label={`Confirm and close ${item.task.description}`}
              >
                Confirm and close
              </Button>
            )}
          />
        ) : null}
        {waitingOnOthers.length ? (
          <AttentionGroup
            label="Waiting on others"
            items={waitingOnOthers}
            renderAction={(item) => (
              <Button
                variant="outlined"
                size="xsmall"
                disabled={nudged?.has(item.task.id)}
                onClick={() => onNudge?.(item)}
                aria-label={`Nudge ${item.task.delegate.label}`}
              >
                {nudged?.has(item.task.id) ? "Nudged" : "Nudge"}
              </Button>
            )}
          />
        ) : null}
      </Stack>
    </Box>
  );
}

/** A labeled line per item, owner first; past the first item, the rest wait behind "Show more". */
function AttentionGroup({
  label,
  items,
  renderAction,
}: {
  label: string;
  items: AttentionItem[];
  renderAction: (item: AttentionItem) => React.ReactNode;
}) {
  const { tokens } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? items : items.slice(0, 1);
  return (
    <Stack gap={SPACE.item}>
      <Typography
        variant="textMd"
        component="h3"
        sx={{ color: tokens.semantic.color.type.muted.value, fontWeight: tokens.semantic.fontWeight.emphasis.value }}
      >
        {label}
      </Typography>
      <Stack component="ul" gap={SPACE.item} sx={{ listStyle: "none", m: 0, p: 0 }}>
        {shown.map((item) => (
          <Stack component="li" key={item.task.id} direction="row" alignItems="center" gap={SPACE.group}>
            <Typography variant="body1" sx={{ flex: 1, minWidth: 0 }}>
              <Box component="span" sx={{ fontWeight: tokens.semantic.fontWeight.emphasis.value }}>
                {item.task.delegate.label}
              </Box>
              {` · ${item.task.description}`}
            </Typography>
            <Box sx={{ flexShrink: 0 }}>{renderAction(item)}</Box>
          </Stack>
        ))}
      </Stack>
      {items.length > 1 && !expanded ? (
        <Button variant="text" size="small" onClick={() => setExpanded(true)} sx={{ alignSelf: "flex-start" }}>
          Show {items.length - 1} more
        </Button>
      ) : null}
    </Stack>
  );
}
