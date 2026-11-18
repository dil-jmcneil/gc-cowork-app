import { Box, Stack, Typography, useTheme } from "@mui/material";

import { SPACE } from "@/lib/layout";
import type { Summary } from "@/workstreams/summary";
import type { ActionLine, StatusSentences, SummaryTone } from "@/workstreams/workstreamAttention";

/**
 * The workstream's status summary, styled to stand apart from the cards below
 * it: a tinted panel with an accent bar, in yellow when a step waits on you,
 * red when something blocks the work, and blue otherwise.
 *
 * A started workstream passes `status`: two sentences, what's been done then
 * what's next with any blocker in bold, and `actions`: one line per blocked or
 * delayed task saying what it needs. The task cards below hold the buttons. A
 * draft passes `summary`: a bold headline and its supporting sentences.
 */
export function StatusSummary({
  label = "Status Summary",
  tone = "information",
  summary,
  status,
  actions = [],
}: {
  /** The panel's heading: "Status Summary" for a started workstream, "Summary" for a draft. */
  label?: string;
  /** Atlas status color: warning when a step waits on you, error when something blocks the work. */
  tone?: SummaryTone;
  summary?: Summary;
  status?: StatusSentences;
  actions?: ActionLine[];
}) {
  const { tokens } = useTheme();
  const info = tokens.component.statusIndicator.colors[tone];
  const emphasis = tokens.semantic.fontWeight.emphasis.value;

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
          <Typography id="status-summary-heading" variant="textMd" component="h2" sx={{ color: info.color.value, fontWeight: emphasis }}>
            {label}
          </Typography>
          {status ? (
            <Typography variant="body1" component="p">
              {status.done}
              {status.next ? (
                <Box component="span" sx={{ fontWeight: emphasis }}>
                  {` ${status.next}`}
                </Box>
              ) : null}
            </Typography>
          ) : summary ? (
            <>
              <Typography variant="h5" component="p" sx={{ fontWeight: emphasis }}>
                {summary.headline}
              </Typography>
              {summary.support.length ? <Typography variant="body1">{summary.support.join(" ")}</Typography> : null}
            </>
          ) : null}
        </Stack>

        {actions.length ? (
          <Stack component="ul" gap={SPACE.item} sx={{ listStyle: "none", m: 0, p: 0 }} aria-label="What needs action">
            {actions.map(({ task, text }) => (
              <Typography key={task.id} variant="body1" component="li">
                <Box component="span" sx={{ fontWeight: emphasis }}>
                  {task.description}
                </Box>
                {` · ${text}`}
              </Typography>
            ))}
          </Stack>
        ) : null}
      </Stack>
    </Box>
  );
}
