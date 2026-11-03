import OpenFileIcon from "@diligentcorp/atlas-react-bundle/icons/OpenFile";
import { ClickableCard } from "@diligentcorp/atlas-react-bundle";
import ScaleIcon from "@diligentcorp/atlas-react-bundle/icons/Scale";
import { Box, Stack, Typography, useTheme } from "@mui/material";
import { useState } from "react";

import { InsightDialog } from "@/components/home/InsightDialog";
import { ATTENTION_ITEMS, type AttentionItem } from "@/home/attentionItems";
import { INSIGHTS } from "@/insights/insights";
import { SPACE } from "@/lib/layout";

/** Figma "Attention pane": a plain title, then one card per item that needs the GC. */
export function AttentionPane({ heading = "Your Diligent Daily Brief" }: { heading?: string }) {
  const { tokens } = useTheme();
  const [openInsightId, setOpenInsightId] = useState<string | null>(null);
  const openInsight = INSIGHTS.find((c) => c.id === openInsightId) ?? null;

  return (
    <Stack gap={SPACE.section} component="section" aria-labelledby="attention-pane-heading">
      {/* Figma Title/H6 Xs: 14px semibold. */}
      <Typography
        id="attention-pane-heading"
        variant="h6"
        component="h2"
        sx={{
          color: tokens.semantic.color.type.default.value,
          fontWeight: tokens.semantic.fontWeight.emphasis.value,
        }}
      >
        {heading}
      </Typography>
      <Stack
        component="ul"
        gap={SPACE.group}
        aria-label="Items that need your attention"
        sx={{ listStyle: "none", m: 0, p: 0 }}
      >
        {ATTENTION_ITEMS.map((item) => (
          <Box component="li" key={item.id}>
            <AttentionCard item={item} onOpen={() => setOpenInsightId(item.id)} />
          </Box>
        ))}
      </Stack>
      <InsightDialog insight={openInsight} onClose={() => setOpenInsightId(null)} />
    </Stack>
  );
}

function AttentionCard({ item, onOpen }: { item: AttentionItem; onOpen: () => void }) {
  const { tokens, presets } = useTheme();
  const StatusIndicator = presets.StatusIndicatorPresets.components.StatusIndicator;
  const muted = tokens.semantic.color.type.muted.value;
  const emphasis = tokens.semantic.fontWeight.emphasis.value;

  return (
    <ClickableCard onClick={onOpen} sx={{ display: "block", width: "100%", textAlign: "left", p: SPACE.block }}>
      <Stack gap={SPACE.group}>
        <Stack direction="row" alignItems="center" gap={SPACE.group} flexWrap="wrap" sx={{ minHeight: 32 }}>
          <Stack direction="row" alignItems="center" gap={SPACE.item} sx={{ color: muted }}>
            <Stack direction="row" alignItems="center" gap={SPACE.pair}>
              <ScaleIcon aria-hidden style={{ width: 20, height: 20 }} />
              <Typography
                variant="body1"
                sx={{
                  color: "inherit",
                  fontWeight: tokens.semantic.fontWeight.bold.value,
                }}
              >
                {item.source}
              </Typography>
            </Stack>
            <Typography variant="body1" aria-hidden sx={{ color: "inherit" }}>
              ·
            </Typography>
            <Typography variant="body1" sx={{ color: "inherit" }}>
              {item.receivedAt}
            </Typography>
          </Stack>
          <StatusIndicator color="information" label={item.badge} />
        </Stack>

        <Stack gap={SPACE.pair} sx={{ minWidth: 0 }}>
          {/* 16px semibold title: the one important header on the card. The summary is 14px body text. */}
          <Typography
            variant="h5"
            component="span"
            display="block"
            sx={{
              fontWeight: emphasis,
              color: tokens.semantic.color.type.default.value,
            }}
          >
            {item.title}
          </Typography>
          <Typography variant="body1" component="span" display="block" sx={{ color: muted }}>
            {item.summary}
          </Typography>
          <Stack direction="row" alignItems="center" gap={SPACE.item} sx={{ color: muted, pt: SPACE.item }}>
            <OpenFileIcon aria-hidden style={{ width: 16, height: 16, flexShrink: 0 }} />
            <Typography variant="body1" sx={{ color: "inherit" }}>
              {item.relatedPolicy}
            </Typography>
          </Stack>
        </Stack>
      </Stack>
    </ClickableCard>
  );
}
