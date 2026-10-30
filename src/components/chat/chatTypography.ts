import type { Theme } from "@mui/material";

/** Atlas Light Body: Inter, 14px/20px, regular. Body Enhanced uses emphasis (600). */
export function chatBodyTypography({ tokens }: Theme) {
  const body = tokens.semantic.font.text.body;
  return {
    fontFamily: "var(--lens-semantic-font-family-body), sans-serif",
    fontSize: body.fontSize.value,
    lineHeight: body.lineHeight.value,
    letterSpacing: body.letterSpacing.value,
    fontWeight: tokens.semantic.fontWeight.regular.value,
  };
}
