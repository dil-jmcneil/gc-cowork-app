import { Card, CardContent, Stack, Typography, useTheme } from "@mui/material";
import type { ReactNode } from "react";

import { SPACE } from "@/lib/layout";

/**
 * White card that segments one content area of a page: a 14px semibold
 * header, then the content. 16px padding, 12px between content groups.
 */
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
      sx={{ p: 0, bgcolor: tokens.semantic.color.surface.default.value, height: "100%" }}
    >
      <CardContent sx={{ p: SPACE.block, "&:last-child": { pb: SPACE.block } }}>
        <Stack gap={SPACE.group}>
          <Stack direction="row" alignItems="center" gap={SPACE.item} sx={{ minHeight: 32 }}>
            {icon}
            <Typography
              variant="h6"
              component="h2"
              sx={{ fontWeight: tokens.semantic.fontWeight.emphasis.value, flex: 1 }}
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

/** A 12px emphasized label above a value. Helper text an experienced user can skip. */
export function FieldLabel({ id, children }: { id?: string; children: ReactNode }) {
  const { tokens } = useTheme();
  return (
    <Typography
      id={id}
      variant="textMd"
      sx={{
        color: tokens.semantic.color.type.muted.value,
        fontWeight: tokens.semantic.fontWeight.emphasis.value,
      }}
    >
      {children}
    </Typography>
  );
}
