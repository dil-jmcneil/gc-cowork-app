import { Avatar, Stack, Typography, useTheme } from "@mui/material";

function initials(name: string): string {
  const parts = name.replace(/^@/, "").split(/[\s.@]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

/** Avatar with a name and a secondary line (role, email, or channel). */
export function PersonLine({
  name,
  detail,
  size = 32,
  wrap = false,
}: {
  name: string;
  detail?: string;
  size?: number;
  /** Let the detail wrap instead of truncating, for narrow columns. */
  wrap?: boolean;
}) {
  const { tokens } = useTheme();
  return (
    <Stack direction="row" alignItems="center" gap={1.25} sx={{ minWidth: 0 }}>
      <Avatar sx={{ width: size, height: size, fontSize: size <= 28 ? 12 : 14 }} aria-hidden>
        {initials(name)}
      </Avatar>
      <Stack sx={{ minWidth: 0 }}>
        <Typography variant="textMd" sx={{ fontWeight: tokens.semantic.fontWeight.emphasis.value }} noWrap>
          {name}
        </Typography>
        {detail ? (
          <Typography
            variant="textSm"
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
