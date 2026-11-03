import OpenFileIcon from "@diligentcorp/atlas-react-bundle/icons/OpenFile";
import { Card, CardContent, Chip, Stack, Typography, useTheme } from "@mui/material";
import type { ReactNode } from "react";

import { SPACE } from "@/lib/layout";
import { CHANNEL_LABEL, type MessageAuthorRole, type TaskMessage } from "@/workstreams/thread";

import { PersonLine } from "./PersonLine";

export const WHEN = new Intl.DateTimeFormat("en-US", {
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

/**
 * One entry in a history list: who (left), kind and time (right), then the
 * content. 12px padding and 8px between lines keep a long list dense.
 */
export function HistoryCard({
  header,
  label,
  sentAt,
  subtle = false,
  children,
}: {
  header: ReactNode;
  /** What kind of entry this is, e.g. "Email", "Action", "File". */
  label: string;
  sentAt: string;
  /** Tint the card, for the GC's own messages. */
  subtle?: boolean;
  children?: ReactNode;
}) {
  const { tokens, presets } = useTheme();
  const StatusIndicator = presets.StatusIndicatorPresets.components.StatusIndicator;
  return (
    <Card
      component="li"
      variant="outlined"
      sx={{ listStyle: "none", p: 0, bgcolor: subtle ? tokens.semantic.color.surface.subtle.value : undefined }}
    >
      <CardContent sx={{ p: SPACE.group, "&:last-child": { pb: SPACE.group } }}>
        <Stack gap={SPACE.item}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" gap={SPACE.item}>
            {header}
            <Stack direction="row" alignItems="center" gap={SPACE.item} sx={{ flexShrink: 0 }}>
              <StatusIndicator color="subtle" label={label} />
              <Typography variant="textMd" sx={{ color: tokens.semantic.color.type.muted.value, whiteSpace: "nowrap" }}>
                {WHEN.format(new Date(sentAt))}
              </Typography>
            </Stack>
          </Stack>
          {children}
        </Stack>
      </CardContent>
    </Card>
  );
}

/** A message in a task's history. `context` replaces the role line, e.g. with the task name. */
export function ThreadMessage({ message, context }: { message: TaskMessage; context?: string }) {
  const { tokens } = useTheme();
  const detail = [context ?? ROLE_LABEL[message.authorRole], message.to ? `to ${message.to.join(", ")}` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <HistoryCard
      header={<PersonLine name={message.authorName} detail={detail} />}
      label={CHANNEL_LABEL[message.channel]}
      sentAt={message.sentAt}
      subtle={message.authorRole === "delegator"}
    >
      <Stack gap={SPACE.pair}>
        {message.subject ? (
          <Typography variant="body1" sx={{ fontWeight: tokens.semantic.fontWeight.emphasis.value }}>
            {message.subject}
          </Typography>
        ) : null}
        <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
          {message.body}
        </Typography>
      </Stack>
      {message.attachments?.length ? (
        <Stack direction="row" gap={SPACE.item} flexWrap="wrap">
          {message.attachments.map((name) => (
            <Chip key={name} label={name} variant="outlined" icon={<OpenFileIcon aria-hidden />} />
          ))}
        </Stack>
      ) : null}
    </HistoryCard>
  );
}
