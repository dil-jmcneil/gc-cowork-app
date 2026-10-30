import { Stack, Typography, useTheme } from "@mui/material";

/** Capability summary shown under the Command Center / New chat hero heading. */
export const COMMAND_CENTER_CHAT_CAPABILITY_SUMMARY =
  "Ask about a rule, see what's changed, or check what's due. Cowork keeps track of the regulations that affect you.";

/**
 * Shared hero heading for Command Center home and New chat — non-personalized title
 * plus a second line summarizing assistant capabilities.
 */
export function CommandCenterChatHero() {
  const { tokens } = useTheme();

  return (
    <Stack alignItems="center" gap={1.5} sx={{ textAlign: "center" }}>
      <Typography
        variant="h3"
        align="center"
        sx={{
          maxWidth: 760,
          color: tokens.semantic.color.type.default.value,
          fontWeight: tokens.semantic.fontWeight.regular.value,
          lineHeight: 1.2,
        }}
      >
        What can I help you with today?
      </Typography>
      <Typography
        variant="textMd"
        align="center"
        sx={{
          maxWidth: 720,
          color: tokens.semantic.color.type.muted.value,
        }}
      >
        {COMMAND_CENTER_CHAT_CAPABILITY_SUMMARY}
      </Typography>
    </Stack>
  );
}
