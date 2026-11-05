import ScaleIcon from "@diligentcorp/atlas-react-bundle/icons/Scale";
import { Link, Stack, Typography, useTheme } from "@mui/material";

import { formatDate } from "@/lib/dates";
import { SignalTags } from "@/components/signals/SignalTags";
import { ISSUED_LABEL, SOURCE_LINK_LABEL, signalType, type Signal } from "@/signals/signal";
import { STATUS_COLOR, currentStatus } from "@/signals/signalStatus";

import { FieldLabel, SectionCard } from "./SectionCard";
import { SPACE } from "@/lib/layout";
import { useWorkstreamStore } from "@/workstreams/workstreamStore";

export function SourceSignalCard({ signal }: { signal: Signal }) {
  return (
    <SectionCard title="Source" icon={<ScaleIcon aria-hidden />}>
      <SourceDetails signal={signal} />
    </SectionCard>
  );
}

/** Who issued the signal, its tags, the source link, and when it was issued. Its dates are in Key Dates. */
export function SourceDetails({ signal }: { signal: Signal }) {
  const { presets } = useTheme();
  const hasWorkstream = useWorkstreamStore((s) => s.workstreams.some((w) => w.sourceSignalId === signal.id));
  const status = currentStatus(signal, hasWorkstream);
  const StatusIndicator = presets.StatusIndicatorPresets.components.StatusIndicator;
  return (
    <Stack gap={SPACE.group}>
      <Stack direction="row" alignItems="center" gap={SPACE.item} flexWrap="wrap">
        <StatusIndicator color={STATUS_COLOR[status]} label={status} />
        <Typography variant="body1">{signal.source}</Typography>
      </Stack>
      <Typography variant="body1">{signal.title}</Typography>
      <SignalTags tags={signal.tags} />
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
      <Stack gap={SPACE.pair}>
        <FieldLabel>{ISSUED_LABEL[signalType(signal)]}</FieldLabel>
        <Typography variant="body1">{formatDate(signal.issuedDate)}</Typography>
        {signal.history ? <Typography variant="body1">{signal.history}</Typography> : null}
      </Stack>
    </Stack>
  );
}
