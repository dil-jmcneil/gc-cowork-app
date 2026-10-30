import type { Theme } from "@mui/material/styles";

/**
 * Inner padding for Command Center side-nav rows — matches global-nav `.item`
 * (same as the Command Center home link).
 */
export function commandCenterNavRowInnerSx(tokens: Theme["tokens"]) {
  return {
    padding: tokens.core.spacing[1].value,
    boxSizing: "border-box" as const,
  };
}

/** Extra start padding so row text aligns with a small search field icon. */
export function commandCenterNavSearchAlignedRowSx(tokens: Theme["tokens"]) {
  return {
    ...commandCenterNavRowInnerSx(tokens),
    paddingInlineStart: `calc(${tokens.core.spacing[1].value} + 1px + ${tokens.core.spacing["1_5"].value})`,
  };
}

/** Fixed-width trailing column so +, arrow, and status dots share a right edge. */
export function commandCenterNavTrailingSlotWidth(tokens: Theme["tokens"]) {
  return tokens.semantic.iconSize.lg.value;
}
