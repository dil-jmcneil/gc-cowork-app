import type { ChatStreamChunk } from "@/chat/chatTypes";
import {
  isInsightsPrompt,
  streamInsights,
} from "@/chat/scenarios/insightsScenario";
import { streamText } from "@/chat/scenarios/streamHelpers";

function buildGenericReply(prompt: string): string {
  const trimmed = prompt.trim();
  if (!trimmed) {
    return "I didn't catch that — try sending a question to the assistant.";
  }
  return 'I can\'t answer that one yet — this reply is a placeholder. Try "Show recent insights" to see what Cowork can do.';
}

/**
 * Streams a mock assistant reply for a prompt. Aborting the signal ends the
 * stream with an `abort` chunk.
 */
export async function* streamMockReply(
  promptText: string,
  signal: AbortSignal,
  replyText?: string,
): AsyncGenerator<ChatStreamChunk> {
  try {
    if (replyText) {
      yield* streamText(replyText, signal);
    } else if (isInsightsPrompt(promptText)) {
      yield* streamInsights(signal);
    } else {
      yield* streamText(buildGenericReply(promptText), signal);
    }
    yield signal.aborted ? { type: "abort" } : { type: "finish" };
  } catch {
    yield { type: "abort" };
  }
}
