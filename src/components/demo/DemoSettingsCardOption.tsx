import { Box, Stack, Typography, useTheme } from "@mui/material";
import CheckedIcon from "@diligentcorp/atlas-react-bundle/icons/Checked";

export type DemoSettingsCardOptionProps = {
  /** Label rendered in emphasized text. */
  title: string;
  /** Muted supporting copy below the title. */
  description: string;
  selected: boolean;
  onSelect: () => void;
};

/**
 * Selectable card used inside `<DemoSettingsDialog>` — title, description,
 * and trailing radio.
 */
export function DemoSettingsCardOption({
  title,
  description,
  selected,
  onSelect,
}: DemoSettingsCardOptionProps) {
  const { tokens } = useTheme();

  const selectedColor = tokens.semantic.color.action.primary.default.value;
  const idleBorder = tokens.semantic.color.outline.fixed.value;

  return (
    <Box
      component="button"
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      sx={{
        display: "flex",
        gap: tokens.core.spacing[2].value,
        width: "100%",
        textAlign: "left",
        cursor: "pointer",
        font: "inherit",
        padding: tokens.core.spacing[2].value,
        borderRadius: tokens.semantic.radius.lg.value,
        backgroundColor: tokens.semantic.color.surface.default.value,
        border: `${selected ? "2px" : "1px"} solid ${
          selected ? selectedColor : idleBorder
        }`,
        margin: selected ? 0 : "1px",
        "&:hover": {
          backgroundColor:
            tokens.semantic.color.action.secondary.hoverFill.value,
        },
        "&:focus-visible": {
          outline: `${tokens.semantic.borderWidth.focusWidth.value} solid ${tokens.semantic.color.ui.focusRing.value}`,
          outlineOffset: tokens.semantic.borderWidth.focusOffset.value,
        },
      }}
    >
      <Stack flex={1} minWidth={0} gap={0.25}>
          <Typography
            variant="textMd"
            sx={{
              fontWeight: tokens.semantic.fontWeight.emphasis.value,
              color: tokens.semantic.color.type.default.value,
            }}
          >
            {title}
          </Typography>
          <Typography
            variant="textMd"
            sx={{ color: tokens.semantic.color.type.muted.value }}
          >
            {description}
          </Typography>
      </Stack>

      <Box
        aria-hidden
        sx={{
          flexShrink: 0,
          width: 24,
          height: 24,
          borderRadius: "50%",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          border: selected ? "none" : `1.5px solid ${idleBorder}`,
          backgroundColor: selected ? selectedColor : "transparent",
          color: selected
            ? tokens.semantic.color.action.primary.onPrimary.value
            : "transparent",
          transition: "background-color 120ms ease, border-color 120ms ease",
        }}
      >
        {selected ? (
          <CheckedIcon style={{ width: 16, height: 16 }} />
        ) : null}
      </Box>
    </Box>
  );
}
