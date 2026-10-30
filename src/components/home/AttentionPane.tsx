import OpenFileIcon from "@diligentcorp/atlas-react-bundle/icons/OpenFile";
import { Box, Divider, Stack, Typography, useTheme } from "@mui/material";

import { ATTENTION_ITEMS, type AttentionItem } from "@/home/attentionItems";

/**
 * Soft card elevation from the Figma Attention design (Elevation/New) — a
 * cool-grey drop shadow that lifts each card off the subtle page surface.
 */
const CARD_SHADOW =
  "-1px 2px 4px 0 #A5A7B314, -2px 4px 6px 0 #A5A7B30F, -9px 8px 12px 0 #A5A7B305";

export function AttentionPane({ heading = "Your Diligent daily brief" }: { heading?: string }) {
  const { tokens } = useTheme();

  return (
    <Stack gap={1.5}>
      <Stack gap={1}>
        <Typography
          variant="h5"
          sx={{
            color: tokens.semantic.color.type.default.value,
            fontWeight: tokens.semantic.fontWeight.emphasis.value,
          }}
        >
          {heading}
        </Typography>
        <Divider sx={{ borderColor: tokens.semantic.color.outline.fixed.value }} />
      </Stack>
      <Stack component="ul" gap={1.5} aria-label="Items that need your attention" sx={{ listStyle: "none", m: 0, p: 0 }}>
        {ATTENTION_ITEMS.map((item) => (
          <Box component="li" key={item.id}>
            <AttentionCard item={item} />
          </Box>
        ))}
      </Stack>
    </Stack>
  );
}

function AttentionCard({ item }: { item: AttentionItem }) {
  const { tokens, presets } = useTheme();
  const StatusIndicator = presets.StatusIndicatorPresets.components.StatusIndicator;
  const muted = tokens.semantic.color.type.muted.value;

  return (
    <Box
      sx={{
        border: `1px solid ${tokens.semantic.color.outline.fixed.value}`,
        borderRadius: tokens.semantic.radius.lg.value,
        boxShadow: CARD_SHADOW,
        backgroundColor: tokens.semantic.color.surface.default.value,
        px: 3,
        py: 2.5,
      }}
    >
      <Stack gap={1}>
        <Stack direction="row" alignItems="center" gap={1.5} flexWrap="wrap">
          <Typography
            component="span"
            variant="textSm"
            sx={{
              color: muted,
              fontWeight: tokens.semantic.fontWeight.emphasis.value,
              letterSpacing: "0.6px",
              textTransform: "uppercase",
            }}
          >
            {item.tag}
          </Typography>
          <StatusIndicator color="information" label={item.badge} />
        </Stack>
        <Typography
          variant="h4"
          component="h3"
          sx={{ color: tokens.semantic.color.type.default.value }}
        >
          {item.title}
        </Typography>
        <Typography variant="textMd" sx={{ color: tokens.semantic.color.type.default.value }}>
          {item.summary}
        </Typography>
        <Typography variant="textMd" sx={{ color: muted }}>
          {item.meta}
        </Typography>
        <Stack direction="row" alignItems="center" gap={1} sx={{ color: muted, pt: 0.5 }}>
          <OpenFileIcon aria-hidden style={{ width: 16, height: 16 }} />
          <Typography variant="textMd" sx={{ color: "inherit" }}>
            {item.relatedPolicy}
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
}
