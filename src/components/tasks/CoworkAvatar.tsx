import { Box } from "@mui/material";

import coworkAvatarUrl from "@/assets/cowork-avatar.svg";

const SIZE = { small: 24, medium: 32 } as const;

/** The Diligent D, used wherever Cowork speaks or acts. The bare logo: no circle or border. */
export function CoworkAvatar({ size = "small" }: { size?: keyof typeof SIZE }) {
  return (
    <Box
      component="img"
      src={coworkAvatarUrl}
      alt=""
      aria-hidden
      sx={{ width: SIZE[size], height: SIZE[size], flexShrink: 0, display: "block" }}
    />
  );
}

export { coworkAvatarUrl };
