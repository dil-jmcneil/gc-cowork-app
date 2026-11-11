import type { CannedReply, ChatStreamChunk } from "@/chat/chatTypes";
import { isSignalsPrompt, streamSignals } from "@/chat/scenarios/signalsScenario";
import { streamText } from "@/chat/scenarios/streamHelpers";

function buildGenericReply(prompt: string): string {
  const trimmed = prompt.trim();
  if (!trimmed) {
    return "I didn't catch that — try sending a question to the assistant.";
  }
  return 'I can\'t answer that one yet — this reply is a placeholder. Try "Show recent signals" to see what Cowork can do.';
}

/**
 * Streams a mock assistant reply for a prompt. Aborting the signal ends the
 * stream with an `abort` chunk.
 */
export async function* streamMockReply(
  promptText: string,
  signal: AbortSignal,
  reply?: CannedReply,
): AsyncGenerator<ChatStreamChunk> {
  try {
    if (reply) {
      const { text, parts = [] } = typeof reply === "string" ? { text: reply } : reply;
      yield* streamText(text, signal);
      for (const part of parts) {
        if (signal.aborted) break;
        if (part.type === "suggested-actions" || part.type === "a2ui") yield { type: "part", part };
      }
    } else if (/\brevise the plan\b/i.test(promptText)) {
      yield* streamText(
        "Sure. Tell me what to change. For example, ask me to remove a task and move its closing step to another one.",
        signal,
      );
    } else if (isSignalsPrompt(promptText)) {
      yield* streamSignals(signal);
    } else {
      yield* streamText(buildGenericReply(promptText), signal);
    }
    yield signal.aborted ? { type: "abort" } : { type: "finish" };
  } catch {
    yield { type: "abort" };
  }
}
