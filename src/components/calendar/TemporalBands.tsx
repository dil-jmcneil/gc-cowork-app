import { Box, Stack, Typography, useTheme } from "@mui/material";

import { BAND_LABEL, bandDates, type TemporalBand } from "@/calendar/weeks";
import { SPACE } from "@/lib/layout";

/**
 * How each temporal band looks, after the "Temporal Bands" calendar iteration:
 * a colored accent and tinted header for this week, neutral for next week, and
 * faded, shaded rows further out. Earlier reads like Further Out.
 */
export function useBandLook(band: TemporalBand) {
  const { tokens } = useTheme();
  const { color } = tokens.semantic;
  // Atlas status colors: This week uses the informational blue, Next week the
  // neutral (generic) gray, from the StatusIndicator component tokens. Further
  // out is lighter still, with shaded, faded rows.
  const status = tokens.component.statusIndicator.colors;
  const near = {
    accent: status.information.color.value,
    headerBg: status.information.backgroundColor.value,
    label: status.information.color.value,
    rowBg: color.surface.default.value,
    rowHoverBg: status.information.backgroundColor.value,
    faded: false,
  };
  const next = {
    accent: status.generic.color.value,
    headerBg: status.generic.backgroundColor.value,
    label: status.generic.color.value,
    rowBg: color.surface.default.value,
    rowHoverBg: color.surface.subtle.value,
    faded: false,
  };
  const far = {
    accent: color.status.neutral.background.value,
    headerBg: color.surface.subtle.value,
    label: color.type.muted.value,
    rowBg: color.surface.subtle.value,
    rowHoverBg: color.surface.variant.value,
    faded: true,
  };
  return { "this-week": near, "next-week": next, further: far, earlier: far }[band];
}

/** "This Week · 2 items · Nov 2 – Nov 8", on the band's tinted background. */
export function BandHeader({ band, count, todayIso }: { band: TemporalBand; count: number; todayIso: string }) {
  const { tokens } = useTheme();
  const look = useBandLook(band);
  return (
    <Stack
      direction="row"
      alignItems="center"
      gap={SPACE.item}
      sx={{ px: SPACE.block, py: SPACE.item, bgcolor: look.headerBg }}
    >
      <Typography
        component="h3"
        variant="body1"
        sx={{ color: look.label, fontWeight: tokens.semantic.fontWeight.emphasis.value }}
      >
        {BAND_LABEL[band]}
      </Typography>
      <Box
        component="span"
        sx={{
          px: SPACE.item,
          borderRadius: tokens.semantic.radius.full.value,
          bgcolor: tokens.semantic.color.surface.default.value,
          border: `1px solid ${tokens.semantic.color.ui.divider.default.value}`,
        }}
      >
        <Typography variant="textMd" sx={{ color: look.label }}>
          {count} {count === 1 ? "item" : "items"}
        </Typography>
      </Box>
      <Typography variant="textMd" sx={{ color: tokens.semantic.color.type.muted.value, ml: "auto" }}>
        {bandDates(band, todayIso)}
      </Typography>
    </Stack>
  );
}
