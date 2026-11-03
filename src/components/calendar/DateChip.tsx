import { Stack, Typography, useTheme } from "@mui/material";

import type { DateTense } from "@/calendar/weeks";
import { SPACE } from "@/lib/layout";

const DAY = new Intl.DateTimeFormat("en-US", { day: "numeric", timeZone: "UTC" });
const MONTH = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });

/** Compact 40px day-over-month badge with Past / Present / Future treatments. */
export function DateChip({ date, tense }: { date: string; tense: DateTense }) {
  const { tokens } = useTheme();
  const { color } = tokens.semantic;
  const parsed = new Date(`${date}T00:00:00Z`);

  const look = {
    past: {
      bg: color.status.neutral.backgroundVariant.value,
      border: color.ui.divider.default.value,
      day: color.type.disabled.value,
      month: color.type.disabled.value,
    },
    present: {
      bg: color.status.notification.background.value,
      border: color.ui.divider.secondary.value,
      day: color.type.default.value,
      month: color.type.muted.value,
    },
    future: {
      bg: color.surface.default.value,
      border: color.ui.divider.secondary.value,
      day: color.type.default.value,
      month: color.type.muted.value,
    },
  }[tense];

  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      sx={{
        width: 40,
        flexShrink: 0,
        py: SPACE.pair,
        borderRadius: tokens.semantic.radius.md.value,
        border: `1px solid ${look.border}`,
        bgcolor: look.bg,
        fontVariantNumeric: "lining-nums tabular-nums",
      }}
    >
      <Typography variant="body1" sx={{ color: look.day, lineHeight: "18px" }}>
        {DAY.format(parsed)}
      </Typography>
      <Typography variant="textMd" sx={{ color: look.month, lineHeight: "14px", textTransform: "uppercase" }}>
        {MONTH.format(parsed)}
      </Typography>
    </Stack>
  );
}
