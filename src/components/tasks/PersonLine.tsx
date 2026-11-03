import { Avatar, Stack, Typography, useTheme } from "@mui/material";

import { SPACE } from "@/lib/layout";

import { CoworkAvatar } from "./CoworkAvatar";

function initials(name: string): string {
  const parts = name.replace(/^@/, "").split(/[\s.@]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

/** Avatar with a name (14px) and a secondary line (12px: role, email, or channel). Cowork gets the Diligent D. */
export function PersonLine({
  name,
  detail,
  wrap = false,
}: {
  name: string;
  detail?: string;
  /** Let the detail wrap instead of truncating, for narrow columns. */
  wrap?: boolean;
}) {
  const { tokens, presets } = useTheme();
  return (
    <Stack direction="row" alignItems="center" gap={SPACE.item} sx={{ minWidth: 0 }}>
      {name === "Cowork" ? (
        <CoworkAvatar />
      ) : (
        <Avatar {...presets.AvatarPresets.getAvatarProps({ size: "small", color: "blue" })} aria-hidden>
          {initials(name)}
        </Avatar>
      )}
      <Stack sx={{ minWidth: 0 }}>
        <Typography variant="body1" sx={{ fontWeight: tokens.semantic.fontWeight.emphasis.value }} noWrap>
          {name}
        </Typography>
        {detail ? (
          <Typography
            variant="textMd"
            sx={{ color: tokens.semantic.color.type.muted.value, overflowWrap: "anywhere" }}
            noWrap={!wrap}
          >
            {detail}
          </Typography>
        ) : null}
      </Stack>
    </Stack>
  );
}
