import ArrowRightIcon from "@diligentcorp/atlas-react-bundle/icons/ArrowRight";
import ProjectsIcon from "@diligentcorp/atlas-react-bundle/icons/Projects";
import { Box, Button, Card, Divider, Link, Stack, Typography, useTheme } from "@mui/material";
import type { ReactNode } from "react";
import { Link as RouterLink } from "react-router";

import { formatDate } from "@/lib/dates";
import type { Workstream } from "@/workstreams/workstream";
import { useWorkstreamStore } from "@/workstreams/workstreamStore";
import { InsightTags } from "@/components/insights/InsightTags";
import { ISSUED_LABEL, RELEVANCE_LABEL, SOURCE_LINK_LABEL, insightType, type Insight } from "@/insights/insight";
import { STATUS_COLOR } from "@/insights/insightStatus";

export function InsightList({ items }: { items: Insight[] }) {
  return (
    <Stack component="ul" gap={1} sx={{ listStyle: "none", m: 0, p: 0 }}>
      {items.map((insight) => (
        <Box component="li" key={insight.id}>
          <InsightCard insight={insight} />
        </Box>
      ))}
    </Stack>
  );
}

function InsightCard({ insight }: { insight: Insight }) {
  const { tokens, presets } = useTheme();
  const StatusIndicator = presets.StatusIndicatorPresets.components.StatusIndicator;
  const workstream = useWorkstreamStore((s) => s.workstreams.find((p) => p.sourceInsightId === insight.id));
  const muted = tokens.semantic.color.type.muted.value;
  const emphasis = tokens.semantic.fontWeight.emphasis.value;

  return (
    <Card sx={{ px: 2, py: 1.5 }}>
      <Stack gap={1}>
        <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
          <StatusIndicator color={STATUS_COLOR[insight.status]} label={insight.status} />
          <Typography variant="textMd" component="h3" sx={{ fontWeight: emphasis, flex: 1, minWidth: 200 }}>
            {insight.title}
          </Typography>
          <Typography variant="textMd" sx={{ color: muted, whiteSpace: "nowrap" }}>
            {insight.source} · {ISSUED_LABEL[insightType(insight)]} {formatDate(insight.issuedDate)}
          </Typography>
        </Stack>

        <InsightTags tags={insight.tags} />
        <Typography variant="textMd">{insight.summary}</Typography>
        {insight.sourceUrl ? (
          <Link
            href={insight.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
            sx={{ alignSelf: "flex-start" }}
          >
            <Typography variant="textMd" sx={{ color: "inherit" }}>
              {SOURCE_LINK_LABEL[insightType(insight)]}
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
            columnGap: 2,
            rowGap: 1,
          }}
        >
          <Detail label={insight.deadlines.length === 1 ? "Deadline" : "Deadlines"}>
            {insight.deadlines.map((deadline) => (
              <Typography key={deadline.label} variant="textMd">
                {deadline.label} · {formatDate(deadline.date)}
              </Typography>
            ))}
          </Detail>
          <Detail label={RELEVANCE_LABEL[insightType(insight)]}>
            {insight.reasonsRelevant.map((reason) => (
              <Typography key={reason} variant="textMd">
                {reason}
              </Typography>
            ))}
          </Detail>
        </Box>

        <Divider />
        {workstream ? <WorkstreamSummary workstream={workstream} /> : <NoWorkstream insightId={insight.id} />}
      </Stack>
    </Card>
  );
}

function WorkstreamSummary({ workstream }: { workstream: Workstream }) {
  const { tokens } = useTheme();
  const muted = tokens.semantic.color.type.muted.value;
  return (
    <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "flex-start", sm: "center" }} gap={1.5}>
      <Stack gap={0.25} sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" alignItems="center" gap={0.75}>
          <ProjectsIcon aria-hidden style={{ width: 16, height: 16 }} />
          <Typography variant="textMd" sx={{ fontWeight: tokens.semantic.fontWeight.emphasis.value }}>
            {workstream.name}
          </Typography>
        </Stack>
        <Typography variant="textMd" sx={{ color: muted }}>
          {workstream.statusSummary}
        </Typography>
      </Stack>
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

function NoWorkstream({ insightId }: { insightId: string }) {
  const { tokens } = useTheme();
  return (
    <Stack direction="row" alignItems="center" gap={1.5}>
      <Typography variant="textMd" sx={{ flex: 1, color: tokens.semantic.color.type.muted.value }}>
        No workstream yet
      </Typography>
      <Button
        component={RouterLink}
        to={`/workstreams/new?insight=${encodeURIComponent(insightId)}`}
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
    <Stack gap={0.25}>
      <Typography
        variant="textSm"
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
