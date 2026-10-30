import { Box, Typography, useTheme } from "@mui/material";
import type { ReactNode } from "react";

import { PrototypeChatThread } from "./PrototypeChatThread";

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
  return (
    <Box sx={{ display: "flex", height: "calc(100vh - 64px)", minHeight: 0 }}>
      <Box sx={{ flex: 1, minWidth: 0, overflowY: "auto" }}>{children}</Box>
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
              variant="textMd"
              component="h2"
              sx={{ py: 1.5, fontWeight: tokens.semantic.fontWeight.emphasis.value }}
            >
              Chat with Cowork
            </Typography>
          }
        />
      </Box>
    </Box>
  );
}
