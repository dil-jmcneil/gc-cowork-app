import { Avatar, useTheme } from "@mui/material";

import coworkAvatarUrl from "@/assets/cowork-avatar.svg";

/** The Diligent D, used wherever Cowork speaks or acts. */
export function CoworkAvatar({ size = "small" }: { size?: "small" | "medium" }) {
  const { presets, tokens } = useTheme();
  return (
    <Avatar
      {...presets.AvatarPresets.getAvatarProps({ size, color: "blue" })}
      src={coworkAvatarUrl}
      alt=""
      aria-hidden
      sx={{
        bgcolor: tokens.semantic.color.surface.default.value,
        border: `1px solid ${tokens.semantic.color.outline.fixed.value}`,
        "& img": { objectFit: "contain", p: "15%" },
      }}
    />
  );
}

export { coworkAvatarUrl };
