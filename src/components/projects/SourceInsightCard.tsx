import ScaleIcon from "@diligentcorp/atlas-react-bundle/icons/Scale";
import { Stack, Typography, useTheme } from "@mui/material";

import { formatDate } from "@/lib/dates";
import { InsightTags } from "@/components/insights/InsightTags";
import { ISSUED_LABEL, insightType, type Insight } from "@/insights/insight";
import { STATUS_COLOR } from "@/insights/insightStatus";

import { FieldLabel, SectionCard } from "./SectionCard";

export function SourceInsightCard({ insight }: { insight: Insight }) {
  const { presets } = useTheme();
  const StatusIndicator = presets.StatusIndicatorPresets.components.StatusIndicator;
  return (
    <SectionCard title="Source" icon={<ScaleIcon aria-hidden />}>
      <Stack gap={1.5}>
        <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
          <StatusIndicator color={STATUS_COLOR[insight.status]} label={insight.status} />
          <Typography variant="textMd">{insight.source}</Typography>
        </Stack>
        <Typography variant="textMd">{insight.title}</Typography>
        <InsightTags tags={insight.tags} />
        <Stack gap={0.25}>
          <FieldLabel>{ISSUED_LABEL[insightType(insight)]}</FieldLabel>
          <Typography variant="textMd">{formatDate(insight.issuedDate)}</Typography>
          {insight.history ? <Typography variant="textMd">{insight.history}</Typography> : null}
        </Stack>
        <Stack gap={0.25}>
          <FieldLabel>{insight.deadlines.length === 1 ? "Deadline" : "Deadlines"}</FieldLabel>
          {insight.deadlines.map((d) => (
            <Typography key={d.label} variant="textMd">
              {d.label} · {formatDate(d.date)}
            </Typography>
          ))}
        </Stack>
      </Stack>
    </SectionCard>
  );
}
