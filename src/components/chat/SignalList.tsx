import ArrowRightIcon from "@diligentcorp/atlas-react-bundle/icons/ArrowRight";
import ProjectsIcon from "@diligentcorp/atlas-react-bundle/icons/Projects";
import { Box, Button, Card, Divider, Link, Stack, Typography, useTheme } from "@mui/material";
import type { ReactNode } from "react";
import { Link as RouterLink } from "react-router";

import { formatDate } from "@/lib/dates";
import type { Workstream } from "@/workstreams/workstream";
import { useWorkstreamStore } from "@/workstreams/workstreamStore";
import { SignalTags } from "@/components/signals/SignalTags";
import {
  ISSUED_LABEL,
  RELEVANCE_LABEL,
  SOURCE_LINK_LABEL,
  signalType,
  type Signal,
  hasPlan,
  pastWorkstreamProgress,
  type PastWorkstream,
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
        {workstream ? (
          <WorkstreamLink workstream={workstream} />
        ) : signal.pastWorkstream ? (
          <PastWorkstreamLine workstream={signal.pastWorkstream} />
        ) : null}
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
          {signal.deadlines.length ? (
            <Detail label={signal.deadlines.length === 1 ? "Deadline" : "Deadlines"}>
              {signal.deadlines.map((deadline) => (
                <Typography key={deadline.label} variant="body1">
                  {deadline.label} · {formatDate(deadline.date)}
                </Typography>
              ))}
            </Detail>
          ) : null}
          <Detail label={RELEVANCE_LABEL}>
            {signal.reasonsRelevant.map((reason) => (
              <Typography key={reason} variant="body1">
                {reason}
              </Typography>
            ))}
          </Detail>
        </Box>

        {workstream ? (
          <>
            <Divider />
            <WorkstreamSummary workstream={workstream} />
          </>
        ) : signal.outcome ? (
          <>
            <Divider />
            <Typography variant="body1" sx={{ color: tokens.semantic.color.type.muted.value }}>
              {signal.outcome}
            </Typography>
          </>
        ) : signal.pastWorkstream || !hasPlan(signal) ? null : (
          <>
            <Divider />
            <NoWorkstream signalId={signal.id} />
          </>
        )}
      </Stack>
    </Card>
  );
}

function WorkstreamSummary({ workstream }: { workstream: Workstream }) {
  const { tokens } = useTheme();
  const muted = tokens.semantic.color.type.muted.value;
  return (
    <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "flex-start", sm: "center" }} gap={SPACE.group}>
      <Typography variant="body1" sx={{ flex: 1, minWidth: 0, color: muted }}>
        {workstream.statusSummary}
      </Typography>
      <Button
        component={RouterLink}
        to={`/workstreams/${workstream.id}`}
        variant="outlined"
        size="small"
        endIcon={<ArrowRightIcon aria-hidden style={{ width: 14, height: 14 }} />}
        sx={{ flexShrink: 0 }}
      >
        Open workstream
      </Button>
    </Stack>
  );
}

/** Above the title: the signal's workstream, linked. */
function WorkstreamLink({ workstream }: { workstream: Workstream }) {
  const { tokens } = useTheme();
  return (
    <Link
      component={RouterLink}
      to={`/workstreams/${workstream.id}`}
      underline="hover"
      sx={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: SPACE.pair }}
    >
      <ProjectsIcon aria-hidden style={{ width: 16, height: 16 }} />
      <Typography
        variant="body1"
        component="span"
        sx={{ color: "inherit", fontWeight: tokens.semantic.fontWeight.emphasis.value }}
      >
        Workstream: {workstream.name}
      </Typography>
    </Link>
  );
}

/**
 * Above the title: a workstream from before the prototype's story. It has no
 * page, so it's a label with its progress instead of a link.
 */
function PastWorkstreamLine({ workstream }: { workstream: PastWorkstream }) {
  const { tokens } = useTheme();
  const muted = tokens.semantic.color.type.muted.value;
  return (
    <Stack direction="row" alignItems="center" gap={SPACE.pair} flexWrap="wrap" sx={{ color: muted }}>
      <ProjectsIcon aria-hidden style={{ width: 16, height: 16 }} />
      <Typography
        variant="body1"
        component="span"
        sx={{ color: "inherit", fontWeight: tokens.semantic.fontWeight.emphasis.value }}
      >
        Workstream: {workstream.name}
      </Typography>
      <Typography variant="body1" component="span" sx={{ color: "inherit" }}>
        · {workstream.status} · {pastWorkstreamProgress(workstream)}
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

function Detail({ label, children }: { label: string; children: ReactNode }) {
  const { tokens } = useTheme();
  return (
    <Stack gap={SPACE.pair}>
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
