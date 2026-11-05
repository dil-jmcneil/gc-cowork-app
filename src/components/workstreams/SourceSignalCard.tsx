import CalendarIcon from "@diligentcorp/atlas-react-bundle/icons/Calendar";
import ScaleIcon from "@diligentcorp/atlas-react-bundle/icons/Scale";
import { Box, Link, Stack, Typography, useTheme } from "@mui/material";

import { formatDate } from "@/lib/dates";
import { SignalTags } from "@/components/signals/SignalTags";
import { ISSUED_LABEL, SOURCE_LINK_LABEL, signalType, type Signal } from "@/signals/signal";
import { STATUS_COLOR, currentStatus } from "@/signals/signalStatus";

import { SectionCard } from "./SectionCard";
import { SPACE } from "@/lib/layout";
import { useWorkstreamStore } from "@/workstreams/workstreamStore";

/** The Source card, laid across the page above Relevance and Key Dates. */
export function SourceSignalCard({ signal }: { signal: Signal }) {
  return (
    <SectionCard title="Source" icon={<ScaleIcon aria-hidden />}>
      <SourceStrip signal={signal} />
    </SectionCard>
  );
}

/**
 * The signal's source laid out horizontally, as in the signal dialog's header:
 * who issued it and the link to read it, when it was issued with its status at
 * the right, then its tags. Its dates are in Key Dates.
 */
export function SourceStrip({ signal }: { signal: Signal }) {
  const { tokens, presets } = useTheme();
  const hasWorkstream = useWorkstreamStore((s) => s.workstreams.some((w) => w.sourceSignalId === signal.id));
  const status = currentStatus(signal, hasWorkstream);
  const StatusIndicator = presets.StatusIndicatorPresets.components.StatusIndicator;
  const muted = tokens.semantic.color.type.muted.value;
  const type = signalType(signal);

  return (
    <Stack gap={SPACE.group}>
      <Stack direction="row" alignItems="baseline" justifyContent="space-between" gap={SPACE.block} flexWrap="wrap">
        <Typography variant="body1">
          {signal.source}
          {signal.citation ? <Box component="span" sx={{ color: muted }}>{` · ${signal.citation}`}</Box> : null}
        </Typography>
        {signal.sourceUrl ? (
          <Link href={signal.sourceUrl} target="_blank" rel="noopener noreferrer" underline="hover">
            <Typography variant="body1" component="span" sx={{ color: "inherit" }}>
              {SOURCE_LINK_LABEL[type]}
            </Typography>
          </Link>
        ) : null}
      </Stack>

      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={SPACE.block}>
        <Stack direction="row" alignItems="flex-start" gap={SPACE.item} sx={{ color: muted, minWidth: 0 }}>
          <CalendarIcon aria-hidden style={{ width: 16, height: 16, marginTop: 2, flexShrink: 0 }} />
          <Typography variant="body1" sx={{ color: "inherit" }}>
            {ISSUED_LABEL[type]} {formatDate(signal.issuedDate)}
            {signal.history ? `. ${signal.history}.` : ""}
          </Typography>
        </Stack>
        <Box sx={{ flexShrink: 0 }}>
          <StatusIndicator color={STATUS_COLOR[status]} label={status} />
        </Box>
      </Stack>

      <SignalTags tags={signal.tags} />
    </Stack>
  );
}
