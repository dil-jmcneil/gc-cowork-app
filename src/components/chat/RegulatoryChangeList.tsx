import AiSparkleIcon from "@diligentcorp/atlas-react-bundle/icons/AiSparkle";
import ArrowRightIcon from "@diligentcorp/atlas-react-bundle/icons/ArrowRight";
import ProjectsIcon from "@diligentcorp/atlas-react-bundle/icons/Projects";
import {
  Box,
  Button,
  Card,
  Divider,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import type { ReactNode } from "react";
import { Link as RouterLink } from "react-router";

import { formatDate } from "@/lib/dates";
import type { Project } from "@/projects/project";
import { useProjectStore } from "@/projects/projectStore";
import type { RegulatoryChange } from "@/regulatory/regulatoryChange";
import { STATUS_COLOR } from "@/regulatory/regulatoryStatus";

export function RegulatoryChangeList({ items }: { items: RegulatoryChange[] }) {
  return (
    <Stack component="ul" gap={1} sx={{ listStyle: "none", m: 0, p: 0 }}>
      {items.map((change) => (
        <Box component="li" key={change.id}>
          <RegulatoryChangeCard change={change} />
        </Box>
      ))}
    </Stack>
  );
}

function RegulatoryChangeCard({ change }: { change: RegulatoryChange }) {
  const { tokens, presets } = useTheme();
  const StatusIndicator = presets.StatusIndicatorPresets.components.StatusIndicator;
  const project = useProjectStore((s) => s.projects.find((p) => p.sourceChangeId === change.id));
  const muted = tokens.semantic.color.type.muted.value;
  const emphasis = tokens.semantic.fontWeight.emphasis.value;

  return (
    <Card sx={{ px: 2, py: 1.5 }}>
      <Stack gap={1}>
        <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
          <StatusIndicator color={STATUS_COLOR[change.status]} label={change.status} />
          <Typography variant="textMd" component="h3" sx={{ fontWeight: emphasis, flex: 1, minWidth: 200 }}>
            {change.title}
          </Typography>
          <Typography variant="textMd" sx={{ color: muted, whiteSpace: "nowrap" }}>
            {change.regulatoryBody} · Effective {formatDate(change.effectiveDate)}
          </Typography>
        </Stack>

        <Typography variant="textMd">{change.summary}</Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1fr) minmax(0, 1fr)" },
            columnGap: 2,
            rowGap: 1,
          }}
        >
          <Detail label={change.deadlines.length === 1 ? "Deadline" : "Deadlines"}>
            {change.deadlines.map((deadline) => (
              <Typography key={deadline.label} variant="textMd">
                {deadline.label} · {formatDate(deadline.date)}
              </Typography>
            ))}
          </Detail>
          <Detail label="Why it matters">
            {change.reasonsRelevant.map((reason) => (
              <Typography key={reason} variant="textMd">
                {reason}
              </Typography>
            ))}
          </Detail>
        </Box>

        <Divider />
        {project ? <ProjectSummary project={project} /> : <NoProject changeId={change.id} />}
      </Stack>
    </Card>
  );
}

function ProjectSummary({ project }: { project: Project }) {
  const { tokens } = useTheme();
  const muted = tokens.semantic.color.type.muted.value;
  return (
    <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "flex-start", sm: "center" }} gap={1.5}>
      <Stack gap={0.25} sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" alignItems="center" gap={0.75}>
          <ProjectsIcon aria-hidden style={{ width: 16, height: 16 }} />
          <Typography variant="textMd" sx={{ fontWeight: tokens.semantic.fontWeight.emphasis.value }}>
            {project.name}
          </Typography>
        </Stack>
        <Stack direction="row" alignItems="flex-start" gap={0.75} sx={{ color: muted }}>
          <AiSparkleIcon aria-label="AI-generated summary" style={{ width: 16, height: 16, flexShrink: 0, marginTop: 3 }} />
          <Typography variant="textMd" sx={{ color: "inherit" }}>
            {project.statusSummary}
          </Typography>
        </Stack>
      </Stack>
      <Button
        component={RouterLink}
        to={`/projects/${project.id}`}
        variant="outlined"
        size="small"
        endIcon={<ArrowRightIcon aria-hidden style={{ width: 14, height: 14 }} />}
        sx={{ flexShrink: 0 }}
      >
        Open project
      </Button>
    </Stack>
  );
}

function NoProject({ changeId }: { changeId: string }) {
  const { tokens } = useTheme();
  return (
    <Stack direction="row" alignItems="center" gap={1.5}>
      <Typography variant="textMd" sx={{ flex: 1, color: tokens.semantic.color.type.muted.value }}>
        No project yet
      </Typography>
      <Button
        component={RouterLink}
        to={`/projects/new?change=${encodeURIComponent(changeId)}`}
        variant="contained"
        size="small"
        sx={{ flexShrink: 0 }}
      >
        Create project
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
        sx={{ color: tokens.semantic.color.type.muted.value, fontWeight: tokens.semantic.fontWeight.emphasis.value }}
      >
        {label}
      </Typography>
      {children}
    </Stack>
  );
}
