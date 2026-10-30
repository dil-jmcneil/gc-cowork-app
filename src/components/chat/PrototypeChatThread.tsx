import {
  AIChatContent,
  AIChatContextProvider,
} from "@diligentcorp/atlas-react-bundle";
import { Box, Stack } from "@mui/material";
import { useEffect, useRef, type ReactNode } from "react";

import { AtlasChatBoxComposerInner } from "@/components/chat/AtlasChatBoxComposer";
import { AtlasChatMessages } from "@/components/chat/AtlasChatMessages";
import { useChatRuntime } from "@/runtime/useChatRuntime";

type PrototypeChatThreadProps = {
  chatId: string;
  header?: ReactNode;
};

// Shared content box so message bubbles and the composer share the same
// horizontal bounds: the right edge of a user bubble lines up with the right
// edge of the composer, and the left edge of an assistant bubble lines up with
// the composer's left edge.
const CHAT_CONTENT_MAX_WIDTH = 916;
const CHAT_CONTENT_PX = { xs: 2, sm: 3 };

export function PrototypeChatThread({
  chatId,
  header,
}: PrototypeChatThreadProps) {
  const { messages, sendMessage, stop, isStreaming } = useChatRuntime(chatId);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Re-anchor to the bottom when messages change; a double rAF lets new
  // content's height settle before scrolling.
  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        node.scrollTop = node.scrollHeight;
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [messages]);

  return (
    <AIChatContextProvider>
      <Stack
        sx={({ tokens }) => ({
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: tokens.semantic.color.surface.subtle.value,
        })}
      >
        {header ? (
          <Box
            sx={({ tokens }) => ({
              flexShrink: 0,
              backgroundColor: tokens.semantic.color.surface.subtle.value,
            })}
          >
            <Box
              sx={{
                width: "100%",
                maxWidth: CHAT_CONTENT_MAX_WIDTH,
                mx: "auto",
                px: CHAT_CONTENT_PX,
              }}
            >
              {header}
            </Box>
          </Box>
        ) : null}
        <Box
          ref={scrollRef}
          sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}
        >
          <Box
            sx={{
              width: "100%",
              maxWidth: CHAT_CONTENT_MAX_WIDTH,
              mx: "auto",
              px: CHAT_CONTENT_PX,
              // Refreshed drops the title band above the thread (no `header`),
              // so the first message otherwise sits flush against the top of
              // the scroll area. Restore the breathing room as top margin on
              // the content itself, scoped to the headerless case.
              mt: header ? 0 : "40px",
            }}
          >
            <AIChatContent>
              <AtlasChatMessages messages={messages} />
            </AIChatContent>
            {/* Breathing room so the last message isn't flush against the
                composer once scrolled to the bottom. */}
            <Box aria-hidden sx={{ height: "32px" }} />
          </Box>
        </Box>
        <Box
          sx={({ tokens }) => ({
            flexShrink: 0,
            pb: 2,
            pt: 1,
            backgroundColor: tokens.semantic.color.surface.subtle.value,
          })}
        >
          <Box
            sx={{
              width: "100%",
              maxWidth: CHAT_CONTENT_MAX_WIDTH,
              mx: "auto",
              px: CHAT_CONTENT_PX,
            }}
          >
            <Box sx={{ width: "100%" }}>
              <AtlasChatBoxComposerInner
                isStreaming={isStreaming}
                onSubmit={(prompt) => {
                  const text = prompt.trim();
                  if (!text) return false;
                  void sendMessage(text);
                }}
                onStop={() => stop()}
              />
            </Box>
          </Box>
        </Box>
      </Stack>
    </AIChatContextProvider>
  );
}
