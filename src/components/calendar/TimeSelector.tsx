import CaretLeftIcon from "@diligentcorp/atlas-react-bundle/icons/CaretLeft";
import CaretRightIcon from "@diligentcorp/atlas-react-bundle/icons/CaretRight";
import { Button, IconButton, Stack, Typography, useTheme } from "@mui/material";

/** Figma TimeSelector: outlined previous / next buttons around the range label, then Today. */
export function TimeSelector({
  label,
  onPrevious,
  onNext,
  onToday,
  previousLabel,
  nextLabel,
}: {
  label: string;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  previousLabel: string;
  nextLabel: string;
}) {
  const { tokens } = useTheme();
  const outlined = {
    border: `1px solid ${tokens.semantic.color.action.secondary.outline.value}`,
    borderRadius: tokens.semantic.radius.md.value,
    p: 0.5,
  };
  return (
    <Stack direction="row" alignItems="center" gap={1}>
      <IconButton size="small" aria-label={previousLabel} onClick={onPrevious} sx={outlined}>
        <CaretLeftIcon aria-hidden />
      </IconButton>
      <Typography
        variant="textMd"
        aria-live="polite"
        sx={{
          fontWeight: tokens.semantic.fontWeight.emphasis.value,
          fontVariantNumeric: "lining-nums tabular-nums",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </Typography>
      <IconButton size="small" aria-label={nextLabel} onClick={onNext} sx={outlined}>
        <CaretRightIcon aria-hidden />
      </IconButton>
      <Button variant="outlined" size="small" onClick={onToday}>
        Today
      </Button>
    </Stack>
  );
}
