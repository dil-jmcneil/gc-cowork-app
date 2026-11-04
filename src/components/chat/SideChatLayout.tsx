import { Box, Typography, useTheme } from "@mui/material";
import { useEffect, type ReactNode } from "react";

import { PrototypeChatThread } from "./PrototypeChatThread";
import { SPACE } from "@/lib/layout";

/** Scrolls the page content (not the window or the chat) so the element sits `offset` px below its top. */
export function scrollContentTo(element: HTMLElement, offset = 24): void {
  const content = element.closest<HTMLElement>("[data-side-chat-content]");
  if (!content) return;
  const top = element.getBoundingClientRect().top - content.getBoundingClientRect().top + content.scrollTop - offset;
  content.scrollTo({ top });
}

/** Page content that scrolls on the left, with a white Cowork chat panel (about a third) on the right. */
export function SideChatLayout({
  chatId,
  onUserMessage,
  children,
}: {
  chatId: string;
  onUserMessage?: (text: string) => string | undefined;
  children: ReactNode;
}) {
  const { tokens } = useTheme();
  // The panels scroll on their own; start the window at the top, whatever page came before.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <Box sx={{ display: "flex", height: "calc(100vh - 64px)", minHeight: 0 }}>
      <Box data-side-chat-content sx={{ flex: 1, minWidth: 0, overflowY: "auto" }}>
        {children}
      </Box>
      <Box
        component="aside"
        aria-label="Chat with Cowork"
        sx={{
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          width: { md: "38%", lg: "32%" },
          minWidth: 340,
          maxWidth: 520,
          borderLeft: `1px solid ${tokens.semantic.color.outline.fixed.value}`,
          bgcolor: tokens.semantic.color.surface.default.value,
        }}
      >
        <PrototypeChatThread
          chatId={chatId}
          surface="default"
          onUserMessage={onUserMessage}
          header={
            <Typography
              variant="h6"
              component="h2"
              sx={{ py: SPACE.group, fontWeight: tokens.semantic.fontWeight.emphasis.value }}
            >
              Chat with Cowork
            </Typography>
          }
        />
      </Box>
    </Box>
  );
}
