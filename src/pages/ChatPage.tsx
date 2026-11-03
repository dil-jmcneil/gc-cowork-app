import { Box, Link, Stack, Typography, useTheme } from "@mui/material";
import { Link as RouterLink, useParams } from "react-router";

import { useChatStore } from "@/chat/chatStore";
import { PrototypeChatThread } from "@/components/chat/PrototypeChatThread";
import { useThemeVariantStore } from "@/demo/themeVariantStore";
import { useChatSession } from "@/runtime/useChatSession";
import { planEditFromChat } from "@/workstreams/planChat";
import { useWorkstreamStore } from "@/workstreams/workstreamStore";

/** In a chat opened from a workstream, a request to change the plan edits that workstream's plan. */
function revisePlan(workstreamId: string, text: string): string | undefined {
  const store = useWorkstreamStore.getState();
  const workstream = store.getWorkstream(workstreamId);
  if (!workstream) return undefined;
  const edit = planEditFromChat(workstream.plan, text);
  if (!edit) return undefined;
  store.updatePlan(workstreamId, edit.plan);
  return `${edit.reply} The plan for ${workstream.name} is updated.`;
}

export default function ChatPage() {
  const { chatId } = useParams<{ chatId: string }>();
  const { tokens } = useTheme();
  const chat = useChatStore((s) => (chatId ? s.chats.find((c) => c.id === chatId) : undefined));
  const isRefreshed = useThemeVariantStore((s) => s.variant === "refreshed");

  useChatSession(chat ? chatId : undefined);

  if (!chatId || !chat) {
    return (
      <Stack gap={1} sx={{ p: 4 }} alignItems="flex-start">
        <Typography variant="textMd">Chat not found.</Typography>
        <Link component={RouterLink} to="/">
          Go to home
        </Link>
      </Stack>
    );
  }

  // Refreshed drops the title band; the conversation starts with the first message.
  const header = isRefreshed ? undefined : <ChatHeaderTitle title={chat.title} />;

  return (
    <Box
      sx={{
        height: "calc(100vh - 64px)",
        bgcolor: tokens.semantic.color.surface.subtle.value,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        <PrototypeChatThread
          chatId={chatId}
          header={header}
          onUserMessage={chat.workstreamId ? (text) => revisePlan(chat.workstreamId!, text) : undefined}
        />
      </Box>
    </Box>
  );
}

function ChatHeaderTitle({ title }: { title: string }) {
  const { tokens } = useTheme();
  return (
    <Box
      sx={{
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        boxSizing: "border-box",
        py: tokens.core.spacing[2].value,
        minHeight: `calc(${tokens.core.spacing[2].value} * 2 + ${tokens.core.spacing[4].value})`,
      }}
    >
      <Typography
        variant="h5"
        sx={{
          fontWeight: tokens.semantic.fontWeight.emphasis.value,
          color: tokens.semantic.color.type.default.value,
        }}
      >
        {title}
      </Typography>
    </Box>
  );
}
