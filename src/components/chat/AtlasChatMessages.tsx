import { Box } from "@mui/material";
import type { ChatMessage } from "@/chat/chatTypes";
import { brandActivityPlacement } from "@/chat/brandActivityPlacement";
import { useThemeVariantStore } from "@/demo/themeVariantStore";
import { AtlasChatMessage } from "./AtlasChatMessage";
import { BrandSpinner } from "./BrandSpinner";
import { DiligentLogo } from "./DiligentLogo";

/** Owns placement once per conversation, including the idle prompt-ready position. */
export function AtlasChatMessages({ messages }: { messages: ChatMessage[] }) {
  const refreshed = useThemeVariantStore((state) => state.variant === "refreshed");
  const placement = brandActivityPlacement(messages);
  return (
    <>
      {messages.map((message) => (
        <AtlasChatMessage key={message.id} message={message}
          showWorkingIndicator={refreshed && placement.kind === "working" && placement.messageId === message.id}
        />
      ))}
      {refreshed && placement.kind === "below-message" ? (
        // The mark follows the current step: the animated facet-wave spinner
        // while genuinely generating (moving here once reasoning hands off
        // to the streaming output text), then — once the message is done —
        // the static Diligent logo, signaling the system has settled and is
        // ready for the next instruction.
        placement.working ? (
          <Box role="status" aria-label="Working"
            data-brand-activity="below-message" sx={{ alignSelf: "flex-start", py: 1 }}>
            <BrandSpinner size={16} />
          </Box>
        ) : (
          <Box role="status" aria-label="Ready for your next message"
            data-brand-activity="ready" sx={{ alignSelf: "flex-start", py: 1 }}>
            <DiligentLogo size={32} aria-hidden />
          </Box>
        )
      ) : null}
    </>
  );
}
