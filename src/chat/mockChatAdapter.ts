import type { ChatStreamChunk } from "@/chat/chatTypes";
import { streamText } from "@/chat/scenarios/streamHelpers";

function buildGenericReply(prompt: string): string {
  const trimmed = prompt.trim();
  if (!trimmed) {
    return "I didn't catch that — try sending a question to the assistant.";
  }
  return `I looked into "${trimmed}". This is a mocked reply for now. Try "Show recent regulatory changes" to see what Cowork can do.`;
}

/**
 * Streams a mock assistant reply for a prompt. Aborting the signal ends the
 * stream with an `abort` chunk.
 */
export async function* streamMockReply(
  promptText: string,
  signal: AbortSignal,
): AsyncGenerator<ChatStreamChunk> {
  try {
    yield* streamText(buildGenericReply(promptText), signal);
    yield signal.aborted ? { type: "abort" } : { type: "finish" };
  } catch {
    yield { type: "abort" };
  }
}
