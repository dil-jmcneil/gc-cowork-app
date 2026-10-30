import ScaleIcon from "@diligentcorp/atlas-react-bundle/icons/Scale";
import { Stack, Typography, useTheme } from "@mui/material";

import { formatDate } from "@/lib/dates";
import type { RegulatoryChange } from "@/regulatory/regulatoryChange";
import { STATUS_COLOR } from "@/regulatory/regulatoryStatus";

import { FieldLabel, SectionCard } from "./SectionCard";

export function SourceChangeCard({ change }: { change: RegulatoryChange }) {
  const { presets } = useTheme();
  const StatusIndicator = presets.StatusIndicatorPresets.components.StatusIndicator;
  return (
    <SectionCard title="Source" icon={<ScaleIcon aria-hidden />}>
      <Stack gap={1.5}>
        <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
          <StatusIndicator color={STATUS_COLOR[change.status]} label={change.status} />
          <Typography variant="textMd">{change.regulatoryBody}</Typography>
        </Stack>
        <Typography variant="textMd">{change.title}</Typography>
        <Stack gap={0.25}>
          <FieldLabel>Effective</FieldLabel>
          <Typography variant="textMd">{formatDate(change.effectiveDate)}</Typography>
        </Stack>
        <Stack gap={0.25}>
          <FieldLabel>{change.deadlines.length === 1 ? "Deadline" : "Deadlines"}</FieldLabel>
          {change.deadlines.map((d) => (
            <Typography key={d.label} variant="textMd">
              {d.label} · {formatDate(d.date)}
            </Typography>
          ))}
        </Stack>
      </Stack>
    </SectionCard>
  );
}
