import { Card, CardContent, Stack, Typography, useTheme } from "@mui/material";
import type { ReactNode } from "react";

/** White card that segments one content area of a page, with a compact header. */
export function SectionCard({
  title,
  icon,
  action,
  children,
}: {
  title: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  const { tokens } = useTheme();
  return (
    <Card
      component="section"
      aria-label={title}
      sx={{ bgcolor: tokens.semantic.color.surface.default.value, height: "100%" }}
    >
      <CardContent sx={{ p: 0, pb: 2, "&:last-child": { pb: 2 } }}>
        <Stack gap={1.5}>
          <Stack direction="row" alignItems="center" gap={1} sx={{ minHeight: 32 }}>
            {icon}
            <Typography
              variant="textMd"
              component="h2"
              sx={{ flex: 1, fontWeight: tokens.semantic.fontWeight.emphasis.value }}
            >
              {title}
            </Typography>
            {action}
          </Stack>
          {children}
        </Stack>
      </CardContent>
    </Card>
  );
}

/** Small emphasized label above a value inside a section card. */
export function FieldLabel({ children }: { children: ReactNode }) {
  const { tokens } = useTheme();
  return (
    <Typography
      variant="textSm"
      sx={{ color: tokens.semantic.color.type.muted.value, fontWeight: tokens.semantic.fontWeight.emphasis.value }}
    >
      {children}
    </Typography>
  );
}
