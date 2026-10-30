import { Stack, Typography, useTheme } from "@mui/material";

const DAY = new Intl.DateTimeFormat("en-US", { day: "numeric", timeZone: "UTC" });
const MONTH = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });

/** Compact date box: the day number over a three-letter month, as in the Figma Compliance Calendar. */
export function DateChip({ date, muted = false }: { date: string; muted?: boolean }) {
  const { tokens } = useTheme();
  const parsed = new Date(`${date}T00:00:00Z`);
  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      sx={{
        width: 44,
        height: 44,
        flexShrink: 0,
        borderRadius: tokens.semantic.radius.md.value,
        border: `1px solid ${tokens.semantic.color.outline.fixed.value}`,
        bgcolor: tokens.semantic.color.surface.subtle.value,
        color: muted
          ? tokens.semantic.color.type.disabled.value
          : tokens.semantic.color.type.default.value,
      }}
    >
      <Typography variant="textMd" sx={{ color: "inherit", fontWeight: tokens.semantic.fontWeight.emphasis.value, lineHeight: 1.1 }}>
        {DAY.format(parsed)}
      </Typography>
      <Typography variant="textSm" sx={{ color: "inherit", lineHeight: 1.1, textTransform: "uppercase" }}>
        {MONTH.format(parsed)}
      </Typography>
    </Stack>
  );
}
