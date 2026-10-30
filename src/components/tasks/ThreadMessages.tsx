import OpenFileIcon from "@diligentcorp/atlas-react-bundle/icons/OpenFile";
import { Box, Stack, Typography, useTheme } from "@mui/material";

import { CHANNEL_LABEL, type MessageAuthorRole, type TaskMessage } from "@/projects/thread";

import { PersonLine } from "./PersonLine";

const WHEN = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const ROLE_LABEL: Record<MessageAuthorRole, string> = {
  cowork: "Cowork",
  delegator: "You",
  delegate: "Owner",
  cc: "CC",
};

/** One message in a task's communication thread: who, how, when, then the content. */
export function ThreadMessage({ message }: { message: TaskMessage }) {
  const { tokens, presets } = useTheme();
  const StatusIndicator = presets.StatusIndicatorPresets.components.StatusIndicator;
  const fromGc = message.authorRole === "delegator";
  const detail = [ROLE_LABEL[message.authorRole], message.to ? `to ${message.to.join(", ")}` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <Box
      component="li"
      sx={{
        listStyle: "none",
        p: 1.5,
        borderRadius: tokens.semantic.radius.md.value,
        border: `1px solid ${tokens.semantic.color.outline.fixed.value}`,
        bgcolor: fromGc ? tokens.semantic.color.surface.subtle.value : tokens.semantic.color.surface.default.value,
      }}
    >
      <Stack gap={1}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
          <PersonLine name={message.authorName} detail={detail} size={28} />
          <Stack direction="row" alignItems="center" gap={1} sx={{ flexShrink: 0 }}>
            <StatusIndicator color="subtle" label={CHANNEL_LABEL[message.channel]} />
            <Typography variant="textSm" sx={{ color: tokens.semantic.color.type.muted.value, whiteSpace: "nowrap" }}>
              {WHEN.format(new Date(message.sentAt))}
            </Typography>
          </Stack>
        </Stack>
        {message.subject ? (
          <Typography variant="textMd" sx={{ fontWeight: tokens.semantic.fontWeight.emphasis.value }}>
            {message.subject}
          </Typography>
        ) : null}
        <Typography variant="textMd" sx={{ whiteSpace: "pre-line" }}>
          {message.body}
        </Typography>
        {message.attachments?.length ? (
          <Stack direction="row" gap={1} flexWrap="wrap">
            {message.attachments.map((name) => (
              <Stack
                key={name}
                direction="row"
                alignItems="center"
                gap={0.75}
                sx={{
                  px: 1,
                  py: 0.5,
                  borderRadius: tokens.semantic.radius.md.value,
                  border: `1px solid ${tokens.semantic.color.outline.fixed.value}`,
                  color: tokens.semantic.color.type.default.value,
                }}
              >
                <OpenFileIcon aria-hidden style={{ width: 16, height: 16 }} />
                <Typography variant="textSm">{name}</Typography>
              </Stack>
            ))}
          </Stack>
        ) : null}
      </Stack>
    </Box>
  );
}
