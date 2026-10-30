import OpenFileIcon from "@diligentcorp/atlas-react-bundle/icons/OpenFile";
import ScaleIcon from "@diligentcorp/atlas-react-bundle/icons/Scale";
import { Box, Button, Stack, Typography, useTheme } from "@mui/material";
import { useState } from "react";

import { RegulatoryChangeDialog } from "@/components/home/RegulatoryChangeDialog";
import { ATTENTION_ITEMS, type AttentionItem } from "@/home/attentionItems";
import { REGULATORY_CHANGES } from "@/regulatory/regulatoryChanges";

/** Figma "Attention pane": a plain title, then one card per item that needs the GC. */
export function AttentionPane({ heading = "Your Diligent Daily Brief" }: { heading?: string }) {
  const { tokens } = useTheme();
  const [openChangeId, setOpenChangeId] = useState<string | null>(null);
  const openChange = REGULATORY_CHANGES.find((c) => c.id === openChangeId) ?? null;

  return (
    <Stack gap={3} component="section" aria-labelledby="attention-pane-heading">
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
      <Stack component="ul" gap={1.5} aria-label="Items that need your attention" sx={{ listStyle: "none", m: 0, p: 0 }}>
        {ATTENTION_ITEMS.map((item) => (
          <Box component="li" key={item.id}>
            <AttentionCard item={item} onOpen={() => setOpenChangeId(item.id)} />
          </Box>
        ))}
      </Stack>
      <RegulatoryChangeDialog change={openChange} onClose={() => setOpenChangeId(null)} />
    </Stack>
  );
}

function AttentionCard({ item, onOpen }: { item: AttentionItem; onOpen: () => void }) {
  const { tokens, presets } = useTheme();
  const StatusIndicator = presets.StatusIndicatorPresets.components.StatusIndicator;
  const muted = tokens.semantic.color.type.muted.value;
  const emphasis = tokens.semantic.fontWeight.emphasis.value;

  return (
    <Box
      sx={{
        bgcolor: tokens.semantic.color.surface.default.value,
        border: `1px solid ${tokens.semantic.color.action.secondary.outlineDisabled.value}`,
        borderRadius: tokens.semantic.radius.lg.value,
        p: 3,
      }}
    >
      <Stack gap={2}>
        <Stack direction="row" alignItems="center" gap={1.5} flexWrap="wrap" sx={{ minHeight: 32 }}>
          <Stack direction="row" alignItems="center" gap={1} sx={{ color: muted }}>
            <Stack direction="row" alignItems="center" gap={0.5}>
              <ScaleIcon aria-hidden style={{ width: 20, height: 20 }} />
              <Typography variant="body1" sx={{ color: "inherit", fontWeight: tokens.semantic.fontWeight.bold.value }}>
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

        <Stack direction="row" alignItems="flex-start" gap={5}>
          <Stack gap={0.5} sx={{ flex: 1, minWidth: 0 }}>
            {/* Figma Title/H5 Sm (16px semibold) over Text/Body (16px regular). */}
            <Typography variant="h5" component="h3" sx={{ fontWeight: emphasis, color: tokens.semantic.color.type.default.value }}>
              {item.title}
            </Typography>
            <Typography
              variant="h5"
              component="p"
              sx={{ fontWeight: tokens.semantic.fontWeight.regular.value, color: muted }}
            >
              {item.summary}
            </Typography>
            <Stack direction="row" alignItems="center" gap={1} sx={{ color: muted, pt: 0.5 }}>
              <OpenFileIcon aria-hidden style={{ width: 16, height: 16, flexShrink: 0 }} />
              <Typography variant="body1" sx={{ color: "inherit" }}>
                {item.relatedPolicy}
              </Typography>
            </Stack>
          </Stack>
          <Button variant="outlined" size="small" onClick={onOpen} sx={{ flexShrink: 0 }} aria-label={`Open ${item.title}`}>
            Open
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
