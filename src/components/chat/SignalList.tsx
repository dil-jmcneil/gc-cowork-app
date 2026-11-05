import ProjectsIcon from "@diligentcorp/atlas-react-bundle/icons/Projects";
import { Box, Button, Card, Divider, Link, Stack, Typography, useTheme } from "@mui/material";
import type { ReactNode } from "react";
import { Link as RouterLink } from "react-router";

import { formatDate } from "@/lib/dates";
import { workstreamAttention } from "@/workstreams/workstreamAttention";
import { useWorkstreamStore } from "@/workstreams/workstreamStore";
import { SignalTags } from "@/components/signals/SignalTags";
import {
  ISSUED_LABEL,
  RELEVANCE_LABEL,
  SOURCE_LINK_LABEL,
  shownRelevance,
  signalType,
  type Signal,
  hasPlan,
  pastWorkstreamProgress,
} from "@/signals/signal";
import { STATUS_COLOR, currentStatus } from "@/signals/signalStatus";
import { SPACE } from "@/lib/layout";

export function SignalList({ items }: { items: Signal[] }) {
  return (
    <Stack component="ul" gap={SPACE.item} sx={{ listStyle: "none", m: 0, p: 0 }}>
      {items.map((signal) => (
        <Box component="li" key={signal.id}>
          <SignalCard signal={signal} />
        </Box>
      ))}
    </Stack>
  );
}

function SignalCard({ signal }: { signal: Signal }) {
  const { tokens, presets } = useTheme();
  const StatusIndicator = presets.StatusIndicatorPresets.components.StatusIndicator;
  const workstream = useWorkstreamStore((s) => s.workstreams.find((p) => p.sourceSignalId === signal.id));
  const status = currentStatus(signal, Boolean(workstream));
  const muted = tokens.semantic.color.type.muted.value;
  const emphasis = tokens.semantic.fontWeight.emphasis.value;

  return (
    <Card sx={{ px: SPACE.block, py: SPACE.group }}>
      <Stack gap={SPACE.item}>
        <Stack direction="row" alignItems="center" gap={SPACE.item} flexWrap="wrap">
          <StatusIndicator color={STATUS_COLOR[status]} label={status} />
          <Typography variant="body1" component="h3" sx={{ fontWeight: emphasis, flex: 1, minWidth: 200 }}>
            {signal.title}
          </Typography>
          <Typography variant="textMd" sx={{ color: muted, whiteSpace: "nowrap" }}>
            {signal.source} · {ISSUED_LABEL[signalType(signal)]} {formatDate(signal.issuedDate)}
          </Typography>
        </Stack>

        <SignalTags tags={signal.tags} />
        <Typography variant="body1">{signal.summary}</Typography>
        {signal.sourceUrl ? (
          <Link
            href={signal.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
            sx={{ alignSelf: "flex-start" }}
          >
            <Typography variant="body1" sx={{ color: "inherit" }}>
              {SOURCE_LINK_LABEL[signalType(signal)]}
            </Typography>
          </Link>
        ) : null}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "minmax(0, 1fr) minmax(0, 1fr)",
            },
            columnGap: SPACE.block,
            rowGap: SPACE.item,
          }}
        >
          {/* Every signal has Relevance; only some have deadlines, so Relevance takes the left column. */}
          <Detail label={RELEVANCE_LABEL} fullWidth={signal.deadlines.length === 0}>
            {shownRelevance(signal.reasonsRelevant).map((reason) => (
              <Typography key={reason} variant="body1">
                {reason}
              </Typography>
            ))}
          </Detail>
          {signal.deadlines.length ? (
            <Detail label={signal.deadlines.length === 1 ? "Deadline" : "Deadlines"}>
              {signal.deadlines.map((deadline) => (
                <Typography key={deadline.label} variant="body1">
                  {deadline.label} · {formatDate(deadline.date)}
                </Typography>
              ))}
            </Detail>
          ) : null}
        </Box>

        {workstream ? (
          <>
            <Divider />
            <WorkstreamFooter
              name={workstream.name}
              to={`/workstreams/${workstream.id}`}
              summary={workstreamAttention(workstream, new Date()).summary.headline}
            />
          </>
        ) : signal.pastWorkstream ? (
          <>
            <Divider />
            {/* Past workstreams have no page; their tasks are on the compliance calendar. */}
            <WorkstreamFooter
              name={signal.pastWorkstream.name}
              to="/compliance-calendar"
              summary={withTaskCount(
                signal.pastWorkstream.statusSummary,
                pastWorkstreamProgress(signal.pastWorkstream),
              )}
            />
          </>
        ) : signal.outcome ? (
          <>
            <Divider />
            <Typography variant="body1" sx={{ color: tokens.semantic.color.type.muted.value }}>
              {signal.outcome}
            </Typography>
          </>
        ) : !hasPlan(signal) ? null : (
          <>
            <Divider />
            <NoWorkstream signalId={signal.id} />
          </>
        )}
      </Stack>
    </Card>
  );
}

/** Done tasks over all tasks, e.g. "1 of 7 tasks done". */
/** Leads a status summary with the task count, unless it already starts with one. */
function withTaskCount(summary: string, progress: string): string {
  return /^\d+ of \d+ tasks done/.test(summary) ? summary : `${progress}. ${summary}`;
}

/** Below the divider: the signal's workstream as a link, then a one-line status summary. */
function WorkstreamFooter({ name, to, summary }: { name: string; to: string; summary: string }) {
  const { tokens } = useTheme();
  return (
    <Stack gap={SPACE.pair}>
      <Link
        component={RouterLink}
        to={to}
        underline="hover"
        sx={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: SPACE.pair }}
      >
        <ProjectsIcon aria-hidden style={{ width: 16, height: 16 }} />
        <Typography
          variant="body1"
          component="span"
          sx={{ color: "inherit", fontWeight: tokens.semantic.fontWeight.emphasis.value }}
        >
          Workstream: {name}
        </Typography>
      </Link>
      <Typography variant="body1" sx={{ color: tokens.semantic.color.type.muted.value }}>
        {summary}
      </Typography>
    </Stack>
  );
}

function NoWorkstream({ signalId }: { signalId: string }) {
  const { tokens } = useTheme();
  return (
    <Stack direction="row" alignItems="center" gap={SPACE.group}>
      <Typography variant="textMd" sx={{ flex: 1, color: tokens.semantic.color.type.muted.value }}>
        No workstream yet
      </Typography>
      <Button
        component={RouterLink}
        to={`/workstreams/new?signal=${encodeURIComponent(signalId)}`}
        variant="contained"
        size="small"
        sx={{ flexShrink: 0 }}
      >
        Create workstream
      </Button>
    </Stack>
  );
}

function Detail({ label, fullWidth = false, children }: { label: string; fullWidth?: boolean; children: ReactNode }) {
  const { tokens } = useTheme();
  return (
    <Stack gap={SPACE.pair} sx={fullWidth ? { gridColumn: "1 / -1" } : undefined}>
      <Typography
        variant="textMd"
        sx={{
          color: tokens.semantic.color.type.muted.value,
          fontWeight: tokens.semantic.fontWeight.emphasis.value,
        }}
      >
        {label}
      </Typography>
      {children}
    </Stack>
  );
}
